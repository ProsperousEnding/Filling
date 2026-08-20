const DEFAULT_ADMIN_API_URL = 'https://filling-config-api.initzo.com'

export const ADMIN_API_URL = String(
  import.meta.env.VITE_ADMIN_API_URL || DEFAULT_ADMIN_API_URL
).replace(/\/+$/u, '')

async function parseApiResponse(response) {
  const contentType = response.headers.get('Content-Type') || ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() }

  if (!response.ok) {
    const error = new Error(body?.message || `管理接口请求失败（${response.status}）。`)
    error.status = response.status
    error.code = body?.error || 'api-error'
    error.diagnostics = Array.isArray(body?.diagnostics) ? body.diagnostics : []
    throw error
  }

  return body
}

export async function adminApiRequest(path, options = {}) {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${ADMIN_API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  })

  return parseApiResponse(response)
}

export function getAdminLoginUrl() {
  return `${ADMIN_API_URL}/auth/github`
}

export function getAdminSession() {
  return adminApiRequest('/auth/session')
}

export function logoutAdmin() {
  return adminApiRequest('/auth/logout', { method: 'POST' })
}

export function getAdminConfigs() {
  return adminApiRequest('/api/config')
}

export function validateAdminConfigs(files) {
  return adminApiRequest('/api/config/validate', {
    method: 'POST',
    body: JSON.stringify({ files })
  })
}

export function publishAdminConfigs(expectedHeadOid, files) {
  return adminApiRequest('/api/config', {
    method: 'PUT',
    body: JSON.stringify({ expectedHeadOid, files })
  })
}

export function getAdminDeployments() {
  return adminApiRequest('/api/deployments')
}
