const ALLOWED_COVER_WIDTHS = Object.freeze([480, 800, 1200])
const ALLOWED_COVER_HOSTS = new Set(['t.alcy.cc', 'tc.alcy.cc'])
const COVER_CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=604800'

function parseCoverSource(value) {
  try {
    const url = new URL(String(value || '').trim())

    if (url.protocol !== 'https:' || !ALLOWED_COVER_HOSTS.has(url.hostname)) {
      return null
    }

    return url
  } catch {
    return null
  }
}

function parseCoverWidth(value) {
  const width = Number.parseInt(value, 10)
  return ALLOWED_COVER_WIDTHS.includes(width) ? width : null
}

async function resolveRandomCoverSource(sourceUrl, fetchImpl) {
  if (sourceUrl.hostname !== 't.alcy.cc') {
    return sourceUrl
  }

  const lookupUrl = new URL(sourceUrl)
  lookupUrl.searchParams.set('_filling', crypto.randomUUID())
  const lookupResponse = await fetchImpl(new Request(lookupUrl, {
    headers: { Accept: 'image/*' },
    redirect: 'manual'
  }))
  const location = lookupResponse.headers.get('Location')

  if (!location) {
    return null
  }

  return parseCoverSource(new URL(location, lookupUrl).toString())
}

export async function getOptimizedCover(request, env = {}, fetchImpl = fetch) {
  const requestUrl = new URL(request.url)
  const sourceUrl = parseCoverSource(requestUrl.searchParams.get('url'))
  const width = parseCoverWidth(requestUrl.searchParams.get('width'))

  if (!sourceUrl) {
    return new Response('Invalid or disallowed cover URL.', { status: 400 })
  }

  if (!width) {
    return new Response('Cover width must be 480, 800, or 1200.', { status: 400 })
  }

  if (!env.IMAGES || typeof env.IMAGES.input !== 'function') {
    return Response.redirect(sourceUrl.toString(), 307)
  }

  try {
    const resolvedSourceUrl = await resolveRandomCoverSource(sourceUrl, fetchImpl)

    if (!resolvedSourceUrl) {
      return Response.redirect(sourceUrl.toString(), 307)
    }

    const sourceResponse = await fetchImpl(new Request(resolvedSourceUrl, {
      headers: {
        Accept: request.headers.get('Accept') || 'image/avif,image/webp,image/*,*/*'
      }
    }))

    if (!sourceResponse.ok || !sourceResponse.body) {
      return Response.redirect(sourceUrl.toString(), 307)
    }

    const transformedImage = await env.IMAGES
      .input(sourceResponse.body)
      .transform({ fit: 'scale-down', width })
      .output({ format: 'image/webp', quality: 82 })
    const transformedResponse = transformedImage.response()

    if (transformedResponse.ok) {
      const headers = new Headers(transformedResponse.headers)
      headers.set('Cache-Control', COVER_CACHE_CONTROL)

      return new Response(transformedResponse.body, {
        status: transformedResponse.status,
        statusText: transformedResponse.statusText,
        headers
      })
    }
  } catch {
    // Keep the original source usable when Images binding or the upstream fails.
  }

  return Response.redirect(sourceUrl.toString(), 307)
}

export { ALLOWED_COVER_HOSTS, ALLOWED_COVER_WIDTHS }
