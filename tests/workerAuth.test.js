import assert from 'node:assert/strict'
import test from 'node:test'

import {
  beginGitHubLogin,
  completeGitHubLogin,
  getSessionResponse
} from '../worker/src/auth.js'
import worker from '../worker/src/index.js'
import { TEST_WORKER_ENV } from './helpers/workerFixtures.js'

function getCookiePair(setCookie) {
  return String(setCookie || '').split(';', 1)[0]
}

function createGitHubFetch(userId = 90754592) {
  return async (url) => {
    const normalizedUrl = String(url)

    if (normalizedUrl === 'https://github.com/login/oauth/access_token') {
      return Response.json({
        access_token: 'github-user-token',
        expires_in: 28_800,
        refresh_token: 'github-refresh-token',
        refresh_token_expires_in: 15_552_000
      })
    }

    if (normalizedUrl === 'https://api.github.com/user') {
      return Response.json({
        id: userId,
        login: userId === 90754592 ? 'ProsperousEnding' : 'other-user',
        name: 'Admin',
        avatar_url: 'https://avatars.example/admin.png'
      })
    }

    if (normalizedUrl.startsWith('https://api.github.com/user/installations')) {
      return Response.json({
        installations: [{ id: 155111352 }]
      })
    }

    throw new Error(`Unexpected GitHub request: ${normalizedUrl}`)
  }
}

async function beginLogin() {
  const request = new Request('https://filling-config-api.initzo.com/auth/github')
  const response = await beginGitHubLogin(request, TEST_WORKER_ENV)
  const location = new URL(response.headers.get('Location'))

  return {
    cookie: getCookiePair(response.headers.get('Set-Cookie')),
    state: location.searchParams.get('state'),
    response
  }
}

test('OAuth login starts with an encrypted state cookie and exact callback URL', async () => {
  const login = await beginLogin()
  const location = new URL(login.response.headers.get('Location'))

  assert.equal(location.origin, 'https://github.com')
  assert.equal(location.pathname, '/login/oauth/authorize')
  assert.equal(location.searchParams.get('client_id'), TEST_WORKER_ENV.GITHUB_CLIENT_ID)
  assert.equal(location.searchParams.get('redirect_uri'), TEST_WORKER_ENV.GITHUB_CALLBACK_URL)
  assert.ok(login.state)
  assert.match(login.cookie, /^__Host-filling_oauth_state=/u)
})

test('OAuth callback creates an encrypted admin session for the allowlisted user', async () => {
  const login = await beginLogin()
  const callbackRequest = new Request(
    `https://filling-config-api.initzo.com/auth/github/callback?code=test-code&state=${login.state}`,
    { headers: { Cookie: login.cookie } }
  )
  const callbackResponse = await completeGitHubLogin(
    callbackRequest,
    TEST_WORKER_ENV,
    createGitHubFetch()
  )

  assert.equal(callbackResponse.status, 302)
  assert.equal(
    callbackResponse.headers.get('Location'),
    'https://filling.initzo.com/admin/config?auth=success'
  )

  const setCookies = callbackResponse.headers.getSetCookie()
  const sessionCookie = setCookies
    .map(getCookiePair)
    .find(cookie => cookie.startsWith('__Host-filling_admin_session='))
  assert.ok(sessionCookie)
  assert.equal(sessionCookie.includes('github-user-token'), false)

  const sessionResponse = await getSessionResponse(
    new Request('https://filling-config-api.initzo.com/auth/session', {
      headers: { Cookie: sessionCookie }
    }),
    TEST_WORKER_ENV,
    createGitHubFetch()
  )
  const sessionBody = await sessionResponse.json()

  assert.equal(sessionBody.authenticated, true)
  assert.equal(sessionBody.user.id, '90754592')
})

test('OAuth callback rejects a GitHub account that is not allowlisted', async () => {
  const login = await beginLogin()
  const request = new Request(
    `https://filling-config-api.initzo.com/auth/github/callback?code=test-code&state=${login.state}`,
    { headers: { Cookie: login.cookie } }
  )
  const response = await completeGitHubLogin(
    request,
    TEST_WORKER_ENV,
    createGitHubFetch(123)
  )

  assert.equal(response.status, 302)
  assert.equal(
    response.headers.get('Location'),
    'https://filling.initzo.com/admin/config?error=forbidden'
  )
})

test('Worker health and CORS responses disclose no configured values', async () => {
  const healthResponse = await worker.fetch(
    new Request('https://filling-config-api.initzo.com/health', {
      headers: { Origin: TEST_WORKER_ENV.ADMIN_ORIGIN }
    }),
    TEST_WORKER_ENV
  )
  const health = await healthResponse.json()

  assert.deepEqual(health, {
    ok: true,
    service: 'filling-config-api',
    configured: true,
    missing: []
  })
  assert.equal(
    healthResponse.headers.get('Access-Control-Allow-Origin'),
    TEST_WORKER_ENV.ADMIN_ORIGIN
  )
  assert.equal(healthResponse.headers.get('Vary'), 'Origin')

  const allowedPreflightResponse = await worker.fetch(
    new Request('https://filling-config-api.initzo.com/api/config', {
      method: 'OPTIONS',
      headers: { Origin: TEST_WORKER_ENV.ADMIN_ORIGIN }
    }),
    TEST_WORKER_ENV
  )
  assert.equal(allowedPreflightResponse.status, 204)
  assert.equal(allowedPreflightResponse.headers.get('Vary'), 'Origin')

  const preflightResponse = await worker.fetch(
    new Request('https://filling-config-api.initzo.com/auth/session', {
      method: 'OPTIONS',
      headers: { Origin: 'https://attacker.example' }
    }),
    TEST_WORKER_ENV
  )
  assert.equal(preflightResponse.status, 403)
})
