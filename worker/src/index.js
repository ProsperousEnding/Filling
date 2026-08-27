import {
  beginGitHubLogin,
  completeGitHubLogin,
  getSessionResponse,
  logout
} from './auth.js'
import {
  getConfigs,
  getDeployments,
  updateConfigs,
  validateConfigs
} from './config-api.js'
import { getOptimizedCover } from './cover-image.js'
import { getMissingEnvironmentKeys } from './env.js'
import { HttpError, jsonResponse } from './http.js'

const ROUTES = new Map([
  ['GET /auth/github', beginGitHubLogin],
  ['GET /auth/github/callback', completeGitHubLogin],
  ['GET /auth/session', getSessionResponse],
  ['POST /auth/logout', logout],
  ['GET /api/config', getConfigs],
  ['POST /api/config/validate', validateConfigs],
  ['PUT /api/config', updateConfigs],
  ['GET /api/deployments', getDeployments]
])

function addVaryHeader(headers, value) {
  const values = new Set(
    String(headers.get('Vary') || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  )
  values.add(value)
  headers.set('Vary', Array.from(values).join(', '))
}

function applyResponseHeaders(response, request, env) {
  const headers = new Headers(response.headers)
  const origin = request.headers.get('Origin')
  const adminOrigin = String(env.ADMIN_ORIGIN || '').trim()

  if (origin && origin === adminOrigin) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Credentials', 'true')
    addVaryHeader(headers, 'Origin')
  }

  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Permissions-Policy', 'camera=(), geolocation=(), microphone=()')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

function handleOptions(request, env) {
  const origin = request.headers.get('Origin')
  if (!origin || origin !== String(env.ADMIN_ORIGIN || '').trim()) {
    return jsonResponse({ error: 'invalid-origin', message: '请求来源不受信任。' }, { status: 403 })
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin'
    }
  })
}

async function routeRequest(request, env) {
  const url = new URL(request.url)

  if (request.method === 'OPTIONS') {
    return handleOptions(request, env)
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    const missing = getMissingEnvironmentKeys(env)
    return jsonResponse({
      ok: true,
      service: 'filling-config-api',
      configured: missing.length === 0,
      missing
    })
  }

  if (request.method === 'GET' && url.pathname === '/image/cover') {
    return getOptimizedCover(request, env)
  }

  const handler = ROUTES.get(`${request.method} ${url.pathname}`)
  if (!handler) {
    throw new HttpError(404, 'route-not-found', '接口不存在。')
  }

  return handler(request, env)
}

export default {
  async fetch(request, env) {
    let response

    try {
      response = await routeRequest(request, env)
    } catch (error) {
      if (error instanceof HttpError) {
        response = jsonResponse({ error: error.code, message: error.message }, { status: error.status })
      } else {
        console.error(error)
        response = jsonResponse(
          { error: 'internal-error', message: '服务暂时不可用。' },
          { status: 500 }
        )
      }
    }

    return applyResponseHeaders(response, request, env)
  }
}
