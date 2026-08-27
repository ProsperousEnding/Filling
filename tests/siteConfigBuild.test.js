import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  getMenuPageSourceDiagnostics,
  getUnsupportedConfigPaths
} from '../scripts/build-site-config.mjs'

const temporaryDirectories = []

test.after(async () => {
  await Promise.all(temporaryDirectories.map(directory => rm(directory, {
    recursive: true,
    force: true
  })))
})

async function createContentDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'vue-blog-menu-content-'))
  temporaryDirectories.push(directory)
  return directory
}

test('menu page source diagnostics match the runtime Markdown loader', async () => {
  const contentDirectory = await createContentDirectory()
  await Promise.all([
    mkdir(path.join(contentDirectory, 'empty')),
    mkdir(path.join(contentDirectory, 'projects')),
    writeFile(path.join(contentDirectory, 'about.md'), '# About\n', 'utf8'),
    writeFile(path.join(contentDirectory, 'about.txt'), 'About\n', 'utf8')
  ])
  await writeFile(path.join(contentDirectory, 'projects', 'demo.md'), '# Demo\n', 'utf8')

  const diagnostics = await getMenuPageSourceDiagnostics({
    pages: [
      { key: 'about', title: 'About', component: 'context', file: 'about.md' },
      { key: 'legacy', title: 'Legacy', component: 'context', file: 'about.txt' },
      { key: 'empty', title: 'Empty', component: 'grid', folder: 'empty' },
      { key: 'projects', title: 'Projects', component: 'grid', folder: 'projects' }
    ]
  }, {}, contentDirectory)

  assert.equal(
    diagnostics.some(diagnostic => (
      diagnostic.code === 'unsupported-menu-page-source'
      && diagnostic.path === 'menus.pages.legacy.file'
    )),
    true
  )
  assert.equal(
    diagnostics.some(diagnostic => (
      diagnostic.code === 'empty-menu-page-source'
      && diagnostic.path === 'menus.pages.empty.folder'
      && diagnostic.level === 'warning'
    )),
    true
  )
  assert.equal(diagnostics.some(diagnostic => diagnostic.path.includes('about.file')), false)
  assert.equal(diagnostics.some(diagnostic => diagnostic.path.includes('projects.folder')), false)
})

test('site config generation rejects files outside the managed config manifest', () => {
  const rootDirectory = path.join(path.sep, 'project')
  const configFiles = [
    path.join(rootDirectory, 'blog/config/theme.toml'),
    path.join(rootDirectory, 'blog/config/background.toml')
  ]

  assert.deepEqual(
    getUnsupportedConfigPaths(configFiles, rootDirectory),
    ['blog/config/background.toml']
  )
})
