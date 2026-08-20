import path from 'node:path'

function hasControlCharacters(value) {
  return Array.from(String(value || '')).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
}

function decodeRouteSegment(segment, routePath) {
  let decodedSegment

  try {
    decodedSegment = decodeURIComponent(segment)
  } catch (error) {
    throw new Error(`Static route "${routePath}" contains invalid URL encoding.`, {
      cause: error
    })
  }

  if (
    !decodedSegment
    || decodedSegment === '.'
    || decodedSegment === '..'
    || hasControlCharacters(decodedSegment)
    || /[\\/:?#]/.test(decodedSegment)
  ) {
    throw new Error(`Static route "${routePath}" contains an unsafe path segment.`)
  }

  return decodedSegment
}

export function resolveStaticRouteOutputFile(outputDirectory, routePath) {
  const outputRoot = path.resolve(outputDirectory)
  const normalizedRoute = String(routePath ?? '').trim()

  if (!normalizedRoute) {
    throw new Error('Static route path is required.')
  }

  if (normalizedRoute === '/') {
    return path.join(outputRoot, 'index.html')
  }

  if (/[?#]/.test(normalizedRoute)) {
    throw new Error(`Static route "${normalizedRoute}" cannot contain a query or hash.`)
  }

  const routeSegments = normalizedRoute
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .map(segment => decodeRouteSegment(segment, normalizedRoute))
  const outputFile = path.resolve(outputRoot, ...routeSegments, 'index.html')
  const relativeOutput = path.relative(outputRoot, outputFile)

  if (!relativeOutput || relativeOutput.startsWith('..') || path.isAbsolute(relativeOutput)) {
    throw new Error(`Static route "${normalizedRoute}" resolves outside the output directory.`)
  }

  return outputFile
}
