import assert from 'node:assert/strict'
import test from 'node:test'

import { assertEnvironment, getMissingEnvironmentKeys } from '../worker/src/env.js'
import {
  openSessionPayload,
  parseCookies,
  sealSessionPayload,
  serializeCookie
} from '../worker/src/session.js'
import { TEST_WORKER_ENV } from './helpers/workerFixtures.js'

test('Worker environment normalizes the configured project settings', () => {
  assert.deepEqual(getMissingEnvironmentKeys(TEST_WORKER_ENV), [])

  const settings = assertEnvironment(TEST_WORKER_ENV)
  assert.equal(settings.adminOrigin, 'https://filling.initzo.com')
  assert.equal(settings.callbackUrl, 'https://filling-config-api.initzo.com/auth/github/callback')
  assert.equal(settings.branch, 'main')
})

test('Worker environment reports missing bindings without exposing values', () => {
  assert.deepEqual(getMissingEnvironmentKeys({}), [
    'ADMIN_GITHUB_USER_ID',
    'ADMIN_ORIGIN',
    'GITHUB_BRANCH',
    'GITHUB_CALLBACK_URL',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GITHUB_INSTALLATION_ID',
    'GITHUB_OWNER',
    'GITHUB_REPO',
    'SESSION_SECRET'
  ])
})

test('session payloads round-trip and reject tampering or the wrong purpose', async () => {
  const payload = {
    user: { id: '90754592', login: 'ProsperousEnding' },
    oauth: { accessToken: 'secret-token' }
  }
  const sealed = await sealSessionPayload(
    payload,
    TEST_WORKER_ENV.SESSION_SECRET,
    'admin-session'
  )

  assert.deepEqual(
    await openSessionPayload(sealed, TEST_WORKER_ENV.SESSION_SECRET, 'admin-session'),
    payload
  )
  assert.equal(
    await openSessionPayload(
      `${sealed.slice(0, -1)}x`,
      TEST_WORKER_ENV.SESSION_SECRET,
      'admin-session'
    ),
    null
  )
  assert.equal(
    await openSessionPayload(sealed, TEST_WORKER_ENV.SESSION_SECRET, 'oauth-state'),
    null
  )
  assert.equal(sealed.includes('secret-token'), false)
})

test('session cookies are host-only, HttpOnly and secure in production', () => {
  const request = new Request('https://filling-config-api.initzo.com/auth/session', {
    headers: {
      Cookie: 'first=one; encoded=a=b=c'
    }
  })
  const cookie = serializeCookie('__Host-test', 'value', request, { maxAge: 60 })

  assert.match(cookie, /^__Host-test=value; Path=\/;/u)
  assert.match(cookie, /HttpOnly/u)
  assert.match(cookie, /SameSite=Lax/u)
  assert.match(cookie, /Secure/u)
  assert.deepEqual(parseCookies(request), { first: 'one', encoded: 'a=b=c' })
})
