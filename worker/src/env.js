const REQUIRED_ENV_KEYS = Object.freeze([
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

function normalizeEnvValue(value) {
  return String(value || '').trim()
}

export function getMissingEnvironmentKeys(env = {}) {
  return REQUIRED_ENV_KEYS.filter(key => !normalizeEnvValue(env[key]))
}

export function assertEnvironment(env = {}) {
  const missing = getMissingEnvironmentKeys(env)
  if (missing.length > 0) {
    throw new Error(`Missing Worker configuration: ${missing.join(', ')}`)
  }

  const adminOrigin = new URL(env.ADMIN_ORIGIN)
  const callbackUrl = new URL(env.GITHUB_CALLBACK_URL)

  if (adminOrigin.pathname !== '/' || adminOrigin.search || adminOrigin.hash) {
    throw new Error('ADMIN_ORIGIN must contain only the scheme and host.')
  }

  if (callbackUrl.pathname !== '/auth/github/callback') {
    throw new Error('GITHUB_CALLBACK_URL must end with /auth/github/callback.')
  }

  return {
    adminGithubUserId: normalizeEnvValue(env.ADMIN_GITHUB_USER_ID),
    adminOrigin: adminOrigin.origin,
    branch: normalizeEnvValue(env.GITHUB_BRANCH),
    callbackUrl: callbackUrl.toString(),
    clientId: normalizeEnvValue(env.GITHUB_CLIENT_ID),
    clientSecret: normalizeEnvValue(env.GITHUB_CLIENT_SECRET),
    installationId: normalizeEnvValue(env.GITHUB_INSTALLATION_ID),
    owner: normalizeEnvValue(env.GITHUB_OWNER),
    repo: normalizeEnvValue(env.GITHUB_REPO),
    sessionSecret: normalizeEnvValue(env.SESSION_SECRET)
  }
}

export { REQUIRED_ENV_KEYS }
