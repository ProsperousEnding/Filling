import { HttpError } from './http.js'

const GITHUB_API_URL = 'https://api.github.com'
const GITHUB_API_VERSION = '2026-03-10'
const GITHUB_OAUTH_TOKEN_URL = 'https://github.com/login/oauth/access_token'

function encodeRepositoryPath(path) {
  return String(path || '')
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/')
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(String(value || ''))
  let binary = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }

  return btoa(binary)
}

function decodeBase64Utf8(value) {
  const binary = atob(String(value || '').replace(/\s+/gu, ''))
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

async function parseResponseBody(response) {
  const source = await response.text()
  if (!source) {
    return null
  }

  try {
    return JSON.parse(source)
  } catch {
    return { message: source }
  }
}

function getGitHubErrorMessage(body, fallback) {
  return String(body?.error_description || body?.message || body?.error || fallback)
}

export async function exchangeOAuthCode(settings, code, fetchImpl = fetch) {
  const response = await fetchImpl(GITHUB_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      code,
      redirect_uri: settings.callbackUrl
    })
  })
  const body = await parseResponseBody(response)

  if (!response.ok || !body?.access_token) {
    throw new HttpError(
      502,
      'github-oauth-failed',
      getGitHubErrorMessage(body, 'GitHub 登录令牌交换失败。')
    )
  }

  return body
}

export async function refreshOAuthToken(settings, refreshToken, fetchImpl = fetch) {
  const response = await fetchImpl(GITHUB_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })
  const body = await parseResponseBody(response)

  if (!response.ok || !body?.access_token) {
    throw new HttpError(
      401,
      'github-session-expired',
      getGitHubErrorMessage(body, 'GitHub 登录已过期，请重新登录。')
    )
  }

  return body
}

export async function githubRequest(path, accessToken, options = {}, fetchImpl = fetch) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/vnd.github+json')
  headers.set('Authorization', `Bearer ${accessToken}`)
  headers.set('X-GitHub-Api-Version', GITHUB_API_VERSION)
  headers.set('User-Agent', 'Filling-Config-Admin')

  const response = await fetchImpl(
    path.startsWith('https://') ? path : `${GITHUB_API_URL}${path}`,
    { ...options, headers }
  )
  const body = await parseResponseBody(response)

  if (!response.ok) {
    const status = response.status === 401 ? 401 : response.status === 403 ? 403 : 502
    throw new HttpError(
      status,
      'github-api-error',
      getGitHubErrorMessage(body, `GitHub API 请求失败（${response.status}）。`)
    )
  }

  return body
}

export function fetchAuthenticatedUser(accessToken, fetchImpl = fetch) {
  return githubRequest('/user', accessToken, {}, fetchImpl)
}

export async function verifyAppInstallation(settings, accessToken, fetchImpl = fetch) {
  const result = await githubRequest('/user/installations?per_page=100', accessToken, {}, fetchImpl)
  const expectedId = String(settings.installationId)
  const installation = result?.installations?.find(item => String(item.id) === expectedId)

  if (!installation) {
    throw new HttpError(403, 'github-app-not-installed', 'GitHub App 未安装到当前管理员账户。')
  }

  return installation
}

export async function getRepositoryHead(settings, accessToken, fetchImpl = fetch) {
  const commit = await githubRequest(
    `/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}`
      + `/commits/${encodeURIComponent(settings.branch)}`,
    accessToken,
    {},
    fetchImpl
  )

  if (!commit?.sha) {
    throw new HttpError(502, 'github-invalid-response', 'GitHub 未返回分支提交信息。')
  }

  return String(commit.sha)
}

export async function getRepositoryFile(
  settings,
  accessToken,
  path,
  ref,
  fetchImpl = fetch
) {
  const content = await githubRequest(
    `/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}`
      + `/contents/${encodeRepositoryPath(path)}?ref=${encodeURIComponent(ref)}`,
    accessToken,
    {},
    fetchImpl
  )

  if (content?.type !== 'file' || content.encoding !== 'base64') {
    throw new HttpError(502, 'github-invalid-content', `GitHub 未返回有效配置文件：${path}`)
  }

  return {
    content: decodeBase64Utf8(content.content),
    sha: String(content.sha || '')
  }
}

export async function createFilesCommit(
  settings,
  accessToken,
  expectedHeadOid,
  files,
  fetchImpl = fetch
) {
  const query = `
    mutation CreateConfigCommit($input: CreateCommitOnBranchInput!) {
      createCommitOnBranch(input: $input) {
        commit {
          oid
          url
          committedDate
          messageHeadline
        }
      }
    }
  `
  const response = await fetchImpl('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Filling-Config-Admin',
      'X-GitHub-Api-Version': GITHUB_API_VERSION
    },
    body: JSON.stringify({
      query,
      variables: {
        input: {
          branch: {
            repositoryNameWithOwner: `${settings.owner}/${settings.repo}`,
            branchName: settings.branch
          },
          expectedHeadOid,
          message: {
            headline: 'chore: update site configuration'
          },
          fileChanges: {
            additions: files.map(file => ({
              path: file.path,
              contents: encodeBase64Utf8(file.content)
            }))
          }
        }
      }
    })
  })
  const body = await parseResponseBody(response)

  if (!response.ok || Array.isArray(body?.errors)) {
    const message = body?.errors?.map(error => error.message).join(' ') || body?.message
    const conflict = /expectedHeadOid|head oid|branch.*modified|not.*head/iu.test(String(message || ''))
    throw new HttpError(
      conflict ? 409 : 502,
      conflict ? 'configuration-conflict' : 'github-commit-failed',
      conflict ? '远端配置已经发生变化，请刷新后重新提交。' : String(message || 'GitHub 配置提交失败。')
    )
  }

  const commit = body?.data?.createCommitOnBranch?.commit
  if (!commit?.oid) {
    throw new HttpError(502, 'github-invalid-response', 'GitHub 未返回新提交信息。')
  }

  return commit
}

export async function getWorkflowRuns(settings, accessToken, fetchImpl = fetch) {
  const result = await githubRequest(
    `/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}`
      + `/actions/runs?branch=${encodeURIComponent(settings.branch)}&event=push&per_page=10`,
    accessToken,
    {},
    fetchImpl
  )

  return Array.isArray(result?.workflow_runs) ? result.workflow_runs : []
}
