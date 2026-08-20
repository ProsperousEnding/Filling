const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const OAUTH_STATE_COOKIE = '__Host-filling_oauth_state'
export const SESSION_COOKIE = '__Host-filling_admin_session'

function bytesToBase64Url(bytes) {
  let binary = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
}

function base64UrlToBytes(value) {
  const normalized = String(value || '').replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

async function deriveKey(secret, purpose) {
  const material = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`filling-config-api\0${purpose}\0${secret}`)
  )

  return crypto.subtle.importKey('raw', material, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function sealSessionPayload(value, secret, purpose) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(secret, purpose)
  const plaintext = encoder.encode(JSON.stringify(value))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)

  return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(ciphertext))}`
}

export async function openSessionPayload(value, secret, purpose) {
  const [version, encodedIv, encodedCiphertext] = String(value || '').split('.')
  if (version !== 'v1' || !encodedIv || !encodedCiphertext) {
    return null
  }

  try {
    const key = await deriveKey(secret, purpose)
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64UrlToBytes(encodedIv) },
      key,
      base64UrlToBytes(encodedCiphertext)
    )

    return JSON.parse(decoder.decode(plaintext))
  } catch {
    return null
  }
}

export function parseCookies(request) {
  return String(request.headers.get('Cookie') || '')
    .split(';')
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf('=')
      if (separatorIndex < 1) {
        return cookies
      }

      const name = part.slice(0, separatorIndex).trim()
      const value = part.slice(separatorIndex + 1).trim()
      if (name) {
        cookies[name] = value
      }
      return cookies
    }, {})
}

export function serializeCookie(name, value, request, options = {}) {
  const parts = [
    `${name}=${value}`,
    `Path=${options.path || '/'}`,
    'HttpOnly',
    'SameSite=Lax'
  ]

  if (new URL(request.url).protocol === 'https:') {
    parts.push('Secure')
  }

  if (Number.isFinite(options.maxAge)) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`)
  }

  return parts.join('; ')
}

export function clearCookie(name, request, path = '/') {
  return serializeCookie(name, '', request, { path, maxAge: 0 })
}

export function createRandomState() {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)))
}
