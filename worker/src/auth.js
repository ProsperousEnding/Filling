import { assertEnvironment } from './env.js'
import {
  exchangeOAuthCode,
  fetchAuthenticatedUser,
  refreshOAuthToken,
  verifyAppInstallation
} from './github.js'
import { HttpError, jsonResponse, redirectResponse, requireRequestOrigin } from './http.js'
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  clearCookie,
  createRandomState,
  openSessionPayload,
  parseCookies,
  sealSessionPayload,
  serializeCookie
} from './session.js'

const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60
const TOKEN_REFRESH_WINDOW_MS = 5 * 60 * 1000

function normalizeTokenPayload(token, previousSession = {}) {
  const now = Date.now()
  const expiresIn = Number.parseInt(token.expires_in, 10)
  const refreshExpiresIn = Number.parseInt(token.refresh_token_expires_in, 10)

  return {
    accessToken: token.access_token,
    accessExpiresAt: Number.isFinite(expiresIn) ? now + expiresIn * 1000 : null,
    refreshToken: token.refresh_token || previousSession.refreshToken || '',
    refreshExpiresAt: Number.isFinite(refreshExpiresIn)
      ? now + refreshExpiresIn * 1000
      : previousSession.refreshExpiresAt || null
  }
}

function getAdminConfigUrl(settings, search = '') {
  return `${settings.adminOrigin}/admin/config${search}`
}

async function createSessionCookie(request, settings, session) {
  const value = await sealSessionPayload(session, settings.sessionSecret, 'admin-session')
  return serializeCookie(SESSION_COOKIE, value, request, {
    maxAge: SESSION_MAX_AGE_SECONDS
  })
}

export async function beginGitHubLogin(request, env) {
  const settings = assertEnvironment(env)
  const state = createRandomState()
  const statePayload = await sealSessionPayload(
    { state, createdAt: Date.now() },
    settings.sessionSecret,
    'oauth-state'
  )
  const authorizationUrl = new URL('https://github.com/login/oauth/authorize')
  authorizationUrl.searchParams.set('client_id', settings.clientId)
  authorizationUrl.searchParams.set('redirect_uri', settings.callbackUrl)
  authorizationUrl.searchParams.set('state', state)

  return redirectResponse(authorizationUrl.toString(), {
    headers: {
      'Set-Cookie': serializeCookie(OAUTH_STATE_COOKIE, statePayload, request, {
        maxAge: OAUTH_STATE_MAX_AGE_SECONDS
      })
    }
  })
}

export async function completeGitHubLogin(request, env, fetchImpl = fetch) {
  const settings = assertEnvironment(env)
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookies = parseCookies(request)
  const statePayload = await openSessionPayload(
    cookies[OAUTH_STATE_COOKIE],
    settings.sessionSecret,
    'oauth-state'
  )
  const clearStateCookie = clearCookie(OAUTH_STATE_COOKIE, request)

  if (
    !code
    || !state
    || !statePayload
    || statePayload.state !== state
    || Date.now() - Number(statePayload.createdAt) > OAUTH_STATE_MAX_AGE_SECONDS * 1000
  ) {
    throw new HttpError(400, 'invalid-oauth-state', 'GitHub 登录状态无效或已过期，请重新登录。')
  }

  const token = await exchangeOAuthCode(settings, code, fetchImpl)
  const user = await fetchAuthenticatedUser(token.access_token, fetchImpl)

  if (String(user?.id) !== settings.adminGithubUserId) {
    return redirectResponse(getAdminConfigUrl(settings, '?error=forbidden'), {
      headers: {
        'Set-Cookie': clearStateCookie
      }
    })
  }

  await verifyAppInstallation(settings, token.access_token, fetchImpl)

  const session = {
    version: 1,
    issuedAt: Date.now(),
    user: {
      id: String(user.id),
      login: String(user.login || ''),
      name: String(user.name || ''),
      avatarUrl: String(user.avatar_url || '')
    },
    oauth: normalizeTokenPayload(token)
  }
  const responseHeaders = new Headers()
  responseHeaders.append('Set-Cookie', clearStateCookie)
  responseHeaders.append('Set-Cookie', await createSessionCookie(request, settings, session))

  return redirectResponse(getAdminConfigUrl(settings, '?auth=success'), {
    headers: responseHeaders
  })
}

export async function requireAdminSession(request, env, fetchImpl = fetch) {
  const settings = assertEnvironment(env)
  const cookies = parseCookies(request)
  const session = await openSessionPayload(
    cookies[SESSION_COOKIE],
    settings.sessionSecret,
    'admin-session'
  )

  if (!session || session.version !== 1 || session.user?.id !== settings.adminGithubUserId) {
    throw new HttpError(401, 'authentication-required', '请先使用管理员 GitHub 账号登录。')
  }

  const accessExpiresAt = Number(session.oauth?.accessExpiresAt)
  const accessTokenUsable = session.oauth?.accessToken && (
    !Number.isFinite(accessExpiresAt)
    || accessExpiresAt > Date.now() + TOKEN_REFRESH_WINDOW_MS
  )

  if (accessTokenUsable) {
    return { session, settings, setCookie: '' }
  }

  const refreshExpiresAt = Number(session.oauth?.refreshExpiresAt)
  if (
    !session.oauth?.refreshToken
    || (Number.isFinite(refreshExpiresAt) && refreshExpiresAt <= Date.now())
  ) {
    throw new HttpError(401, 'authentication-expired', '管理员登录已过期，请重新登录。')
  }

  const refreshedToken = await refreshOAuthToken(
    settings,
    session.oauth.refreshToken,
    fetchImpl
  )
  const refreshedSession = {
    ...session,
    oauth: normalizeTokenPayload(refreshedToken, session.oauth)
  }

  return {
    session: refreshedSession,
    settings,
    setCookie: await createSessionCookie(request, settings, refreshedSession)
  }
}

export async function getSessionResponse(request, env, fetchImpl = fetch) {
  try {
    const authentication = await requireAdminSession(request, env, fetchImpl)
    const headers = authentication.setCookie
      ? { 'Set-Cookie': authentication.setCookie }
      : undefined

    return jsonResponse({
      authenticated: true,
      user: authentication.session.user
    }, { headers })
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      return jsonResponse({ authenticated: false, user: null })
    }
    throw error
  }
}

export function logout(request, env) {
  const settings = assertEnvironment(env)
  requireRequestOrigin(request, settings.adminOrigin)

  return jsonResponse(
    { authenticated: false },
    { headers: { 'Set-Cookie': clearCookie(SESSION_COOKIE, request) } }
  )
}
