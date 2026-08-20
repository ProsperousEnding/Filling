import { CONFIG_FILE_DEFINITIONS, getConfigFileDefinition } from '../../src/framework/config/configManifest.js'
import { requireAdminSession } from './auth.js'
import {
  createFilesCommit,
  getRepositoryFile,
  getRepositoryHead,
  getRepositoryTree,
  getWorkflowRuns
} from './github.js'
import { HttpError, jsonResponse, readJsonBody, requireRequestOrigin } from './http.js'
import { normalizeTomlContent, validateManagedConfigFiles } from './config-validation.js'

function withAuthenticationCookie(response, authentication) {
  if (!authentication.setCookie) {
    return response
  }

  const headers = new Headers(response.headers)
  headers.append('Set-Cookie', authentication.setCookie)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

function getAccessToken(authentication) {
  return authentication.session.oauth.accessToken
}

async function loadManagedConfiguration(authentication, fetchImpl = fetch) {
  const { settings } = authentication
  const accessToken = getAccessToken(authentication)
  const headOid = await getRepositoryHead(settings, accessToken, fetchImpl)
  const [files, repositoryTree] = await Promise.all([
    Promise.all(CONFIG_FILE_DEFINITIONS.map(async (definition) => {
      const file = await getRepositoryFile(
        settings,
        accessToken,
        definition.path,
        headOid,
        fetchImpl
      )

      return {
        ...definition,
        content: normalizeTomlContent(file.content),
        sha: file.sha
      }
    })),
    getRepositoryTree(settings, accessToken, headOid, fetchImpl)
  ])

  return { headOid, files, contentSources: createContentSourceManifest(repositoryTree) }
}

function createContentSourceManifest(repositoryTree = []) {
  const prefix = 'blog/content/'
  const files = repositoryTree
    .filter(entry => (
      entry.type === 'blob'
      && entry.path.startsWith(prefix)
      && entry.path.toLowerCase().endsWith('.md')
    ))
    .map(entry => entry.path.slice(prefix.length))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'zh-CN'))
  const folders = Array.from(new Set(files
    .map(path => path.split('/').slice(0, -1).join('/'))
    .filter(Boolean)))
    .sort((left, right) => left.localeCompare(right, 'zh-CN'))

  return { files, folders }
}

function normalizeRequestedFiles(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, 'missing-config-files', '至少需要提交一个配置文件。')
  }

  const seenKeys = new Set()
  return value.map((file) => {
    const key = String(file?.key || '').trim()
    const definition = getConfigFileDefinition(key)

    if (!definition || seenKeys.has(key)) {
      throw new HttpError(400, 'invalid-config-file', '请求包含未知或重复的配置文件。')
    }
    seenKeys.add(key)

    if (typeof file.content !== 'string') {
      throw new HttpError(400, 'invalid-config-content', `${definition.title}的配置内容无效。`)
    }

    return {
      ...definition,
      content: normalizeTomlContent(file.content)
    }
  })
}

function mergeConfigFiles(remoteFiles, changedFiles) {
  const changeByKey = new Map(changedFiles.map(file => [file.key, file]))
  return remoteFiles.map(file => changeByKey.get(file.key) || file)
}

function getValidationResult(files, contentSources = null) {
  const result = validateManagedConfigFiles(files, { contentSources })
  return {
    valid: !result.diagnostics.some(diagnostic => diagnostic.level === 'error'),
    diagnostics: result.diagnostics,
    configs: result.configs
  }
}

export async function getConfigs(request, env, fetchImpl = fetch) {
  const authentication = await requireAdminSession(request, env, fetchImpl)
  const configuration = await loadManagedConfiguration(authentication, fetchImpl)
  const validation = getValidationResult(configuration.files, configuration.contentSources)
  const response = jsonResponse({
    headOid: configuration.headOid,
    files: configuration.files,
    contentSources: configuration.contentSources,
    diagnostics: validation.diagnostics
  })

  return withAuthenticationCookie(response, authentication)
}

export async function validateConfigs(request, env, fetchImpl = fetch) {
  const authentication = await requireAdminSession(request, env, fetchImpl)
  requireRequestOrigin(request, authentication.settings.adminOrigin)
  const body = await readJsonBody(request)
  const requestedFiles = normalizeRequestedFiles(body.files)
  const remote = await loadManagedConfiguration(authentication, fetchImpl)
  const validation = getValidationResult(
    mergeConfigFiles(remote.files, requestedFiles),
    remote.contentSources
  )
  const response = jsonResponse({
    valid: validation.valid,
    diagnostics: validation.diagnostics
  })

  return withAuthenticationCookie(response, authentication)
}

export async function updateConfigs(request, env, fetchImpl = fetch) {
  const authentication = await requireAdminSession(request, env, fetchImpl)
  requireRequestOrigin(request, authentication.settings.adminOrigin)
  const body = await readJsonBody(request)
  const expectedHeadOid = String(body.expectedHeadOid || '').trim()

  if (!/^[a-f\d]{40,64}$/iu.test(expectedHeadOid)) {
    throw new HttpError(400, 'invalid-head-oid', '缺少有效的远端配置版本。')
  }

  const requestedFiles = normalizeRequestedFiles(body.files)
  const remote = await loadManagedConfiguration(authentication, fetchImpl)
  if (remote.headOid !== expectedHeadOid) {
    throw new HttpError(409, 'configuration-conflict', '远端配置已经发生变化，请刷新后重新提交。')
  }

  const mergedFiles = mergeConfigFiles(remote.files, requestedFiles)
  const validation = getValidationResult(mergedFiles, remote.contentSources)
  if (!validation.valid) {
    return withAuthenticationCookie(jsonResponse({
      error: 'invalid-configuration',
      message: '配置校验失败，请修正后再发布。',
      diagnostics: validation.diagnostics
    }, { status: 422 }), authentication)
  }

  const remoteByKey = new Map(remote.files.map(file => [file.key, file]))
  const changedFiles = requestedFiles.filter(file => (
    file.content !== remoteByKey.get(file.key)?.content
  ))

  if (changedFiles.length === 0) {
    return withAuthenticationCookie(jsonResponse({
      changed: false,
      headOid: remote.headOid,
      diagnostics: validation.diagnostics
    }), authentication)
  }

  const commit = await createFilesCommit(
    authentication.settings,
    getAccessToken(authentication),
    expectedHeadOid,
    changedFiles,
    fetchImpl
  )
  const response = jsonResponse({
    changed: true,
    headOid: commit.oid,
    commit: {
      oid: commit.oid,
      url: commit.url,
      committedAt: commit.committedDate,
      message: commit.messageHeadline
    },
    diagnostics: validation.diagnostics
  })

  return withAuthenticationCookie(response, authentication)
}

export async function getDeployments(request, env, fetchImpl = fetch) {
  const authentication = await requireAdminSession(request, env, fetchImpl)
  const runs = await getWorkflowRuns(
    authentication.settings,
    getAccessToken(authentication),
    fetchImpl
  )
  const response = jsonResponse({
    runs: runs.map(run => ({
      id: run.id,
      name: run.name,
      title: run.display_title,
      status: run.status,
      conclusion: run.conclusion,
      headSha: run.head_sha,
      url: run.html_url,
      createdAt: run.created_at,
      updatedAt: run.updated_at
    }))
  })

  return withAuthenticationCookie(response, authentication)
}

export {
  getValidationResult,
  createContentSourceManifest,
  loadManagedConfiguration,
  mergeConfigFiles,
  normalizeRequestedFiles
}
