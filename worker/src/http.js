export class HttpError extends Error {
  constructor(status, code, message, options = {}) {
    super(message, options)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

export function jsonResponse(data, options = {}) {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Cache-Control', options.cacheControl || 'no-store')

  return new Response(JSON.stringify(data), {
    ...options,
    headers
  })
}

export function redirectResponse(location, options = {}) {
  const headers = new Headers(options.headers)
  headers.set('Location', location)
  headers.set('Cache-Control', 'no-store')

  return new Response(null, {
    status: options.status || 302,
    headers
  })
}

export async function readJsonBody(request, maxBytes = 1024 * 1024) {
  const declaredLength = Number.parseInt(request.headers.get('Content-Length') || '', 10)
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new HttpError(413, 'payload-too-large', '请求内容过大。')
  }

  const source = await request.text()
  if (new TextEncoder().encode(source).byteLength > maxBytes) {
    throw new HttpError(413, 'payload-too-large', '请求内容过大。')
  }

  try {
    return source ? JSON.parse(source) : {}
  } catch {
    throw new HttpError(400, 'invalid-json', '请求内容不是有效的 JSON。')
  }
}

export function requireRequestOrigin(request, adminOrigin) {
  const origin = request.headers.get('Origin')
  if (!origin || origin !== adminOrigin) {
    throw new HttpError(403, 'invalid-origin', '请求来源不受信任。')
  }
}
