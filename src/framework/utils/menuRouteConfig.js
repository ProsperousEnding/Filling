import { normalizeBlogRoutePatterns } from './routeLinks.js'

const MENU_PAGE_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]*$/
const MAX_ROUTE_PATTERN_VARIANTS = 256
const MAX_ROUTE_PATTERN_SEGMENTS = 32

export const MENU_COLLECTION_PAGE_COMPONENTS = new Set(['list', 'card', 'grid', 'timeline'])

function normalizeString(value) {
  return String(value || '').trim()
}

function hasControlCharacters(value) {
  return Array.from(String(value || '')).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
}

export function normalizeMenuPageKey(value) {
  return normalizeString(value).toLowerCase()
}

export function isValidMenuPageKey(value) {
  return MENU_PAGE_KEY_PATTERN.test(normalizeMenuPageKey(value))
}

export function isExternalMenuTarget(target) {
  return /^(https?:)?\/\//i.test(target) || target.startsWith('mailto:') || target.startsWith('tel:')
}

export function normalizeMenuLinkTarget(value) {
  const target = normalizeString(value)
  if (!target || hasControlCharacters(target) || /\s/u.test(target)) return ''
  if (!isExternalMenuTarget(target)) return normalizeMenuPagePath(target, '')

  if (/^mailto:/iu.test(target)) {
    return /^mailto:[^@\s]+@[^@\s]+$/iu.test(target) ? target : ''
  }
  if (/^tel:/iu.test(target)) {
    return /^tel:\+?[\d().-]+$/u.test(target) ? target : ''
  }

  try {
    const url = new URL(target.startsWith('//') ? `https:${target}` : target)
    return ['http:', 'https:'].includes(url.protocol) && url.hostname ? target : ''
  } catch {
    return ''
  }
}

export function normalizeMenuPagePath(value, fallback = '') {
  const normalizedValue = normalizeString(value)
  const target = normalizedValue || normalizeString(fallback)

  if (
    !target
    || isExternalMenuTarget(target)
    || hasControlCharacters(target)
    || /[\s\\%?#:*+()[\]]/.test(target)
  ) {
    return ''
  }

  const withLeadingSlash = target.startsWith('/') ? target : `/${target}`
  const canonicalPath = withLeadingSlash === '/'
    ? withLeadingSlash
    : `${withLeadingSlash.replace(/\/+$/, '')}/`

  if (canonicalPath === '/') {
    return canonicalPath
  }

  const segments = canonicalPath.split('/').slice(1, -1)

  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    return ''
  }

  return canonicalPath
}

export function normalizeMenuContentPath(value, kind = 'file') {
  const normalizedValue = normalizeString(value)
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^\/+/, '')
  const segments = normalizedValue
    .split('/')
    .map(segment => segment.trim())
    .filter(segment => segment && segment !== '.')

  if (segments.length === 0 || segments.some(segment => segment === '..')) {
    return ''
  }

  const resolvedPath = segments.join('/')

  return kind === 'folder'
    ? resolvedPath.replace(/\/+$/, '')
    : resolvedPath
}

function splitRoutePattern(value) {
  return normalizeString(value)
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
}

function getRouteSegmentCardinality(segment) {
  if (!segment.includes(':')) {
    return { min: 1, repeatable: false }
  }

  if (segment.endsWith('*')) {
    return { min: 0, repeatable: true }
  }

  if (segment.endsWith('+')) {
    return { min: 1, repeatable: true }
  }

  return {
    min: segment.endsWith('?') ? 0 : 1,
    repeatable: false
  }
}

function expandRoutePattern(value, maxSegments) {
  const segments = splitRoutePattern(value)
  let variants = [[]]

  for (const segment of segments) {
    const cardinality = getRouteSegmentCardinality(segment)
    const maxOccurrences = cardinality.repeatable ? maxSegments : 1
    const nextVariants = []

    for (const variant of variants) {
      for (let count = cardinality.min; count <= maxOccurrences; count += 1) {
        const nextVariant = [...variant, ...Array(count).fill(segment)]

        if (nextVariant.length <= maxSegments) {
          nextVariants.push(nextVariant)
        }

        if (nextVariants.length > MAX_ROUTE_PATTERN_VARIANTS) {
          return { variants: [], truncated: true }
        }
      }
    }

    variants = nextVariants
  }

  return { variants, truncated: false }
}

function routeSegmentsOverlap(leftSegments, rightSegments) {
  return (
    leftSegments.length === rightSegments.length
    && leftSegments.every((leftSegment, index) => {
      const rightSegment = rightSegments[index]
      return leftSegment.includes(':') || rightSegment.includes(':') || leftSegment === rightSegment
    })
  )
}

function getStaticRoutePrefix(value) {
  const segments = splitRoutePattern(value)
  const dynamicIndex = segments.findIndex(segment => segment.includes(':'))
  return dynamicIndex < 0 ? segments : segments.slice(0, dynamicIndex)
}

function routeNamespacesOverlap(leftPattern, rightPattern) {
  const leftPrefix = getStaticRoutePrefix(leftPattern)
  const rightPrefix = getStaticRoutePrefix(rightPattern)
  const sharedLength = Math.min(leftPrefix.length, rightPrefix.length)

  return leftPrefix
    .slice(0, sharedLength)
    .every((segment, index) => segment === rightPrefix[index])
}

export function routePatternsOverlap(leftPattern, rightPattern) {
  const leftSegments = splitRoutePattern(leftPattern)
  const rightSegments = splitRoutePattern(rightPattern)
  const maxSegments = Math.min(
    Math.max(leftSegments.length, rightSegments.length, 1) + 2,
    MAX_ROUTE_PATTERN_SEGMENTS
  )
  const leftExpansion = expandRoutePattern(leftPattern, maxSegments)
  const rightExpansion = expandRoutePattern(rightPattern, maxSegments)

  if (leftExpansion.truncated || rightExpansion.truncated) {
    return routeNamespacesOverlap(leftPattern, rightPattern)
  }

  return leftExpansion.variants.some(leftVariant => (
    rightExpansion.variants.some(rightVariant => (
      routeSegmentsOverlap(leftVariant, rightVariant)
    ))
  ))
}

export function getDynamicBlogRoutePatterns(routePatterns = {}) {
  return Object.entries(normalizeBlogRoutePatterns(routePatterns))
    .filter(([, pattern]) => normalizeString(pattern).includes(':'))
    .map(([key, pattern]) => ({ key, pattern }))
}

export function getCustomMenuPageRoutePatterns(page = {}) {
  const patterns = [{ key: page.key, pattern: page.path, type: 'page' }]

  if (MENU_COLLECTION_PAGE_COMPONENTS.has(page.component) && page.folder) {
    patterns.push({
      key: page.key,
      pattern: `${page.path}:itemId/`,
      type: 'item'
    })
  }

  return patterns.filter(route => route.pattern)
}

export function findOverlappingRoute(routePatterns = [], existingRoutes = []) {
  for (const route of routePatterns) {
    const conflict = existingRoutes.find(existingRoute => (
      routePatternsOverlap(route.pattern, existingRoute.pattern)
    ))

    if (conflict) {
      return { route, conflict }
    }
  }

  return null
}
