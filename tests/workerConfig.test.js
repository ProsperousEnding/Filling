import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { CONFIG_FILE_DEFINITIONS } from '../src/framework/config/configManifest.js'
import { createContentSourceManifest, updateConfigs } from '../worker/src/config-api.js'
import {
  getValidationResult,
  normalizeRequestedFiles
} from '../worker/src/config-api.js'
import { sealSessionPayload, SESSION_COOKIE } from '../worker/src/session.js'
import { TEST_WORKER_ENV } from './helpers/workerFixtures.js'

const HEAD_OID = 'a'.repeat(40)

async function loadLocalConfigFiles() {
  return Promise.all(CONFIG_FILE_DEFINITIONS.map(async definition => ({
    ...definition,
    content: await readFile(new URL(`../${definition.path}`, import.meta.url), 'utf8'),
    sha: 'file-sha'
  })))
}

function encodeBase64(value) {
  return Buffer.from(value, 'utf8').toString('base64')
}

async function createAdminCookie() {
  const session = await sealSessionPayload({
    version: 1,
    user: {
      id: TEST_WORKER_ENV.ADMIN_GITHUB_USER_ID,
      login: 'ProsperousEnding'
    },
    oauth: {
      accessToken: 'github-user-token',
      accessExpiresAt: Date.now() + 60 * 60 * 1000,
      refreshToken: '',
      refreshExpiresAt: null
    }
  }, TEST_WORKER_ENV.SESSION_SECRET, 'admin-session')

  return `${SESSION_COOKIE}=${session}`
}

test('the managed config manifest is an exact path allowlist', () => {
  assert.equal(CONFIG_FILE_DEFINITIONS.length, 14)
  assert.equal(new Set(CONFIG_FILE_DEFINITIONS.map(file => file.key)).size, 14)
  assert.equal(new Set(CONFIG_FILE_DEFINITIONS.map(file => file.path)).size, 14)
  assert.ok(CONFIG_FILE_DEFINITIONS.every(file => (
    file.path.startsWith('blog/config/') && file.path.endsWith('.toml')
  )))
})

test('the Worker validates the repository current TOML configuration', async () => {
  const files = await loadLocalConfigFiles()
  const validation = getValidationResult(files)

  assert.equal(validation.valid, true)
  assert.equal(
    validation.diagnostics.some(diagnostic => diagnostic.level === 'error'),
    false
  )
})

test('repository content manifests expose only Markdown files and usable folders', () => {
  assert.deepEqual(createContentSourceManifest([
    { type: 'blob', path: 'blog/content/about.md' },
    { type: 'blob', path: 'blog/content/articles/first.md' },
    { type: 'blob', path: 'blog/content/articles/notes.txt' },
    { type: 'tree', path: 'blog/content/empty' },
    { type: 'blob', path: 'README.md' }
  ]), {
    files: ['about.md', 'articles/first.md'],
    folders: ['articles']
  })
})

test('the Worker rejects menu pages that reference missing repository content', async () => {
  const files = await loadLocalConfigFiles()
  const site = files.find(file => file.key === 'site')
  site.content = `${site.content.trim()}\n\n[[menus.pages]]\nkey = "missing"\ntitle = "Missing"\ncomponent = "context"\nfile = "missing.md"\n`
  const validation = getValidationResult(files, {
    files: ['about.md', 'articles/example.md'],
    folders: ['articles']
  })

  assert.equal(validation.valid, false)
  assert.ok(validation.diagnostics.some(diagnostic => (
    diagnostic.code === 'missing-menu-page-source'
    && diagnostic.path === 'menus.pages.missing.file'
  )))
})

test('the Worker rejects unknown, duplicate and malformed configuration input', () => {
  assert.throws(
    () => normalizeRequestedFiles([{ key: '../site', content: 'title = "bad"' }]),
    /unknown or duplicate|未知或重复/u
  )
  assert.throws(
    () => normalizeRequestedFiles([{ key: 'background', content: 'enabled = true' }]),
    /unknown or duplicate|未知或重复/u
  )
  assert.throws(
    () => normalizeRequestedFiles([
      { key: 'site', content: 'title = "one"' },
      { key: 'site', content: 'title = "two"' }
    ]),
    /unknown or duplicate|未知或重复/u
  )

  const files = CONFIG_FILE_DEFINITIONS.map(definition => ({
    ...definition,
    content: definition.key === 'site' ? 'title = "unterminated' : ''
  }))
  const validation = getValidationResult(files)

  assert.equal(validation.valid, false)
  assert.ok(validation.diagnostics.some(diagnostic => (
    diagnostic.code === 'invalid-toml' && diagnostic.path === 'blog/config/site.toml'
  )))
})

test('publishing creates one atomic commit containing only changed allowlisted files', async () => {
  const remoteFiles = await loadLocalConfigFiles()
  const fileByPath = new Map(remoteFiles.map(file => [file.path, file]))
  let graphQlBody = null
  const fetchImpl = async (url, options = {}) => {
    const normalizedUrl = String(url)

    if (normalizedUrl.endsWith('/commits/main')) {
      return Response.json({ sha: HEAD_OID })
    }

    if (normalizedUrl.includes('/git/trees/')) {
      return Response.json({
        truncated: false,
        tree: [
          { type: 'blob', path: 'blog/content/about.md', sha: 'content-sha' },
          { type: 'blob', path: 'blog/content/articles/example.md', sha: 'article-sha' }
        ]
      })
    }

    if (normalizedUrl.includes('/contents/')) {
      const path = decodeURIComponent(
        normalizedUrl.split('/contents/')[1].split('?')[0]
      )
      const file = fileByPath.get(path)
      assert.ok(file, `Unexpected config path: ${path}`)
      return Response.json({
        type: 'file',
        encoding: 'base64',
        content: encodeBase64(file.content),
        sha: file.sha
      })
    }

    if (normalizedUrl === 'https://api.github.com/graphql') {
      graphQlBody = JSON.parse(options.body)
      return Response.json({
        data: {
          createCommitOnBranch: {
            commit: {
              oid: 'b'.repeat(40),
              url: 'https://github.com/ProsperousEnding/Filling/commit/test',
              committedDate: '2026-08-20T00:00:00Z',
              messageHeadline: 'chore: update site configuration'
            }
          }
        }
      })
    }

    throw new Error(`Unexpected GitHub request: ${normalizedUrl}`)
  }
  const theme = fileByPath.get('blog/config/theme.toml')
  const request = new Request('https://filling-config-api.initzo.com/api/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: await createAdminCookie(),
      Origin: TEST_WORKER_ENV.ADMIN_ORIGIN
    },
    body: JSON.stringify({
      expectedHeadOid: HEAD_OID,
      files: [{
        key: 'theme',
        content: theme.content.replace(
          'current_preset = "default"',
          'current_preset = "forest"'
        )
      }]
    })
  })
  const response = await updateConfigs(request, TEST_WORKER_ENV, fetchImpl)
  const result = await response.json()

  assert.equal(response.status, 200)
  assert.equal(result.changed, true)
  assert.equal(result.headOid, 'b'.repeat(40))

  const input = graphQlBody.variables.input
  assert.equal(input.expectedHeadOid, HEAD_OID)
  assert.deepEqual(input.branch, {
    repositoryNameWithOwner: 'ProsperousEnding/Filling',
    branchName: 'main'
  })
  assert.equal(input.fileChanges.additions.length, 1)
  assert.equal(input.fileChanges.additions[0].path, 'blog/config/theme.toml')
})
