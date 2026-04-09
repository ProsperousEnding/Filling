import { computed, watch } from 'vue'
import { useConfigStore } from '../stores/config'

function resolveSourceValue(source) {
  return typeof source === 'function' ? source() : source
}

function normalizeMetaText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildDocumentTitle(pageTitle, siteTitle) {
  const normalizedPageTitle = normalizeMetaText(pageTitle)
  const normalizedSiteTitle = normalizeMetaText(siteTitle)

  if (normalizedPageTitle && normalizedSiteTitle && normalizedPageTitle !== normalizedSiteTitle) {
    return `${normalizedPageTitle} - ${normalizedSiteTitle}`
  }

  return normalizedPageTitle || normalizedSiteTitle || ''
}

function getMetaElement({ name, property }) {
  if (typeof document === 'undefined') {
    return null
  }

  const selector = name
    ? `meta[name="${name}"]`
    : `meta[property="${property}"]`

  return document.head.querySelector(selector)
}

function getCanonicalElement() {
  if (typeof document === 'undefined') {
    return null
  }

  return document.head.querySelector('link[rel="canonical"]')
}

function upsertMetaElement({ name, property, content }) {
  if (typeof document === 'undefined') {
    return
  }

  const normalizedContent = normalizeMetaText(content)
  let element = getMetaElement({ name, property })

  if (!normalizedContent) {
    element?.remove()
    return
  }

  if (!element) {
    element = document.createElement('meta')
    if (name) {
      element.setAttribute('name', name)
    }
    if (property) {
      element.setAttribute('property', property)
    }
    document.head.appendChild(element)
  }

  element.setAttribute('content', normalizedContent)
}

function upsertCanonicalElement(href) {
  if (typeof document === 'undefined') {
    return
  }

  const normalizedHref = String(href || '').trim()
  let element = getCanonicalElement()

  if (!normalizedHref) {
    element?.remove()
    return
  }

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }

  element.setAttribute('href', normalizedHref)
}

function normalizeSiteUrl(value) {
  const normalized = String(value || '').trim()

  if (!normalized) {
    return ''
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized.replace(/\/+$/, '')
  }

  return `https://${normalized}`.replace(/\/+$/, '')
}

function joinUrl(base, path) {
  const normalizedBase = normalizeSiteUrl(base)
  const normalizedPath = String(path || '').trim()

  if (!normalizedBase || !normalizedPath || normalizedPath === '/') {
    return normalizedBase
  }

  return `${normalizedBase}/${normalizedPath.replace(/^\/+/, '')}`
}

function normalizeBasePath(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue || normalizedValue === '/') {
    return '/'
  }

  return normalizedValue.startsWith('/')
    ? (normalizedValue.endsWith('/') ? normalizedValue : `${normalizedValue}/`)
    : `/${normalizedValue.replace(/\/+$/, '')}/`
}

function stripBasePath(path, basePath) {
  const normalizedPath = String(path || '').trim()
  const normalizedBasePath = normalizeBasePath(basePath)

  if (!normalizedPath) {
    return ''
  }

  if (normalizedBasePath === '/') {
    return normalizedPath
  }

  const basePrefix = normalizedBasePath.replace(/\/+$/, '')
  const matchesBasePrefix = normalizedPath === basePrefix || normalizedPath.startsWith(`${basePrefix}/`)

  return matchesBasePrefix
    ? normalizedPath.slice(basePrefix.length) || '/'
    : normalizedPath
}

function buildAbsoluteUrl(siteUrl, basePath, routePath) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl)
  const normalizedRoutePath = String(routePath || '').trim()
  const normalizedBasePath = normalizeBasePath(basePath)

  if (!normalizedSiteUrl) {
    return ''
  }

  if (!normalizedRoutePath || normalizedRoutePath === '/') {
    return normalizedBasePath === '/'
      ? normalizedSiteUrl
      : joinUrl(normalizedSiteUrl, normalizedBasePath)
  }

  const normalizedPath = normalizedRoutePath.replace(/^\/+/, '')

  return normalizedBasePath === '/'
    ? joinUrl(normalizedSiteUrl, normalizedPath)
    : joinUrl(normalizedSiteUrl, `${normalizedBasePath.replace(/^\/+/, '')}${normalizedPath}`)
}

export function usePageMetadata(options = {}) {
  const configStore = useConfigStore()

  const pageTitle = computed(() => normalizeMetaText(resolveSourceValue(options.title)))
  const pageDescription = computed(() => normalizeMetaText(resolveSourceValue(options.description)))
  const siteTitle = computed(() => normalizeMetaText(configStore.blogTitle))
  const siteDescription = computed(() => normalizeMetaText(configStore.blogDescription))
  const siteUrl = computed(() => normalizeSiteUrl(configStore.siteUrl))
  const appBasePath = normalizeBasePath(import.meta.env.BASE_URL || '/')
  const pagePath = computed(() => {
    const explicitPath = String(resolveSourceValue(options.path) || '').trim()

    if (explicitPath) {
      return explicitPath
    }

    if (typeof window !== 'undefined') {
      return stripBasePath(window.location.pathname, appBasePath)
    }

    return ''
  })
  const absoluteUrl = computed(() => buildAbsoluteUrl(siteUrl.value, appBasePath, pagePath.value))
  const ogType = computed(() => normalizeMetaText(resolveSourceValue(options.type)) || 'website')

  watch(
    [pageTitle, pageDescription, siteTitle, siteDescription, absoluteUrl, ogType],
    ([nextPageTitle, nextPageDescription, nextSiteTitle, nextSiteDescription, nextAbsoluteUrl, nextOgType]) => {
      if (typeof document === 'undefined') {
        return
      }

      const documentTitle = buildDocumentTitle(nextPageTitle, nextSiteTitle)
      if (documentTitle) {
        document.title = documentTitle
      }

      const description = nextPageDescription || nextSiteDescription

      upsertMetaElement({ name: 'description', content: description })
      upsertMetaElement({ property: 'og:title', content: documentTitle || nextSiteTitle })
      upsertMetaElement({ property: 'og:description', content: description })
      upsertMetaElement({ property: 'og:url', content: nextAbsoluteUrl })
      upsertMetaElement({ property: 'og:type', content: nextOgType })
      upsertMetaElement({ name: 'twitter:title', content: documentTitle || nextSiteTitle })
      upsertMetaElement({ name: 'twitter:description', content: description })
      upsertMetaElement({ name: 'twitter:card', content: 'summary_large_image' })
      upsertCanonicalElement(nextAbsoluteUrl)
    },
    { immediate: true }
  )
}
