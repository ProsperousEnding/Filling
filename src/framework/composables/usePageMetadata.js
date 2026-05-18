import { computed, watch } from 'vue'
import { useConfigStore } from '../stores/config'
import { createSeededArticleCover } from '../utils/articleCover'

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

function normalizeKeywordList(values = []) {
  if (Array.isArray(values)) {
    return values
      .map(value => normalizeMetaText(value))
      .filter(Boolean)
  }

  const normalized = normalizeMetaText(values)
  if (!normalized) {
    return []
  }

  return normalized
    .split(/[,，]/)
    .map(value => value.trim())
    .filter(Boolean)
}

function mergeKeywords(...groups) {
  const uniqueKeywords = new Set()

  groups.flat().forEach((keyword) => {
    const normalizedKeyword = normalizeMetaText(keyword)
    if (normalizedKeyword) {
      uniqueKeywords.add(normalizedKeyword)
    }
  })

  return Array.from(uniqueKeywords)
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

function getLinkElement(rel) {
  if (typeof document === 'undefined') {
    return null
  }

  return document.head.querySelector(`link[rel="${rel}"]`)
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

function upsertLinkElement({ rel, href, attributes = {} }) {
  if (typeof document === 'undefined') {
    return
  }

  const normalizedHref = String(href || '').trim()
  let element = getLinkElement(rel)

  if (!normalizedHref) {
    element?.remove()
    return
  }

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', normalizedHref)
  Object.entries(attributes).forEach(([key, value]) => {
    const normalizedValue = String(value || '').trim()

    if (normalizedValue) {
      element.setAttribute(key, normalizedValue)
    } else {
      element.removeAttribute(key)
    }
  })
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

function buildBaseRelativeUrl(basePath, assetPath) {
  const normalizedAssetPath = String(assetPath || '')
    .trim()
    .replace(/^\.?\//, '')
    .replace(/^\/+/, '')
  const normalizedBasePath = normalizeBasePath(basePath)

  if (!normalizedAssetPath) {
    return ''
  }

  return normalizedBasePath === '/'
    ? `/${normalizedAssetPath}`
    : `${normalizedBasePath}${normalizedAssetPath}`.replace(/(?<!:)\/{2,}/g, '/')
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

function resolveAssetUrl(assetPath, { siteUrl = '', basePath = '/', absolute = false } = {}) {
  const normalizedAssetPath = String(assetPath || '').trim()

  if (!normalizedAssetPath) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(normalizedAssetPath) || normalizedAssetPath.startsWith('data:')) {
    return normalizedAssetPath
  }

  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(normalizedAssetPath)) {
    return ''
  }

  if (absolute && siteUrl) {
    return buildAbsoluteUrl(siteUrl, basePath, normalizedAssetPath)
  }

  return buildBaseRelativeUrl(basePath, normalizedAssetPath)
}

function normalizeShareImageConfig(seo = {}) {
  const shareImage = seo.shareImage && typeof seo.shareImage === 'object'
    ? seo.shareImage
    : {}

  return {
    enabled: shareImage.enabled !== false,
    preferPageImage: shareImage.preferPageImage !== false,
    fallback: ['none', 'site', 'seeded'].includes(String(shareImage.fallback || '').toLowerCase())
      ? String(shareImage.fallback).toLowerCase()
      : 'site',
    defaultImage: normalizeMetaText(shareImage.defaultImage || seo.ogImage),
    twitterImage: normalizeMetaText(shareImage.twitterImage || seo.twitterImage),
    twitterCard: ['summary', 'summary_large_image'].includes(String(shareImage.twitterCard || '').toLowerCase())
      ? String(shareImage.twitterCard).toLowerCase()
      : 'summary_large_image',
    seededWidth: Number.parseInt(shareImage.seededWidth, 10) || 1200,
    seededHeight: Number.parseInt(shareImage.seededHeight, 10) || 630,
    seededFormat: normalizeMetaText(shareImage.seededFormat) || 'webp'
  }
}

function buildSeededShareImage(seed, shareImageConfig) {
  const normalizedSeed = normalizeMetaText(seed) || 'site-share-image'

  return createSeededArticleCover(normalizedSeed, {
    width: shareImageConfig.seededWidth,
    height: shareImageConfig.seededHeight,
    format: shareImageConfig.seededFormat
  })
}

function resolveShareImageUrl({
  pageImage,
  seed,
  shareImageConfig,
  siteUrl,
  basePath,
  twitter = false
}) {
  if (!shareImageConfig.enabled) {
    return ''
  }

  if (shareImageConfig.preferPageImage) {
    const resolvedPageImage = resolveAssetUrl(pageImage, {
      siteUrl,
      basePath,
      absolute: true
    })

    if (resolvedPageImage) {
      return resolvedPageImage
    }
  }

  const configuredImage = twitter
    ? (shareImageConfig.twitterImage || shareImageConfig.defaultImage)
    : shareImageConfig.defaultImage
  const resolvedConfiguredImage = resolveAssetUrl(configuredImage, {
    siteUrl,
    basePath,
    absolute: Boolean(siteUrl)
  })

  if (resolvedConfiguredImage) {
    return resolvedConfiguredImage
  }

  if (shareImageConfig.fallback === 'seeded') {
    return buildSeededShareImage(seed, shareImageConfig)
  }

  return ''
}

export function usePageMetadata(options = {}) {
  const configStore = useConfigStore()

  const pageTitle = computed(() => normalizeMetaText(resolveSourceValue(options.title)))
  const pageDescription = computed(() => normalizeMetaText(resolveSourceValue(options.description)))
  const siteTitle = computed(() => normalizeMetaText(configStore.blogTitle))
  const siteSubtitle = computed(() => normalizeMetaText(configStore.blogSubtitle))
  const siteDescription = computed(() => (
    normalizeMetaText(configStore.blogDescription)
    || siteSubtitle.value
  ))
  const siteUrl = computed(() => normalizeSiteUrl(
    configStore.siteUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  ))
  const appBasePath = normalizeBasePath(import.meta.env.BASE_URL || '/')
  const siteSeo = computed(() => (
    configStore.seo && typeof configStore.seo === 'object' ? configStore.seo : {}
  ))
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
  const pageKeywords = computed(() => normalizeKeywordList(resolveSourceValue(options.keywords)))
  const keywords = computed(() => mergeKeywords(pageKeywords.value, siteSeo.value.keywords || []).join(', '))
  const shareImageConfig = computed(() => normalizeShareImageConfig(siteSeo.value))
  const shareImageSeed = computed(() => (
    normalizeMetaText(resolveSourceValue(options.imageSeed))
    || pageTitle.value
    || pagePath.value
    || siteTitle.value
  ))
  const imageUrl = computed(() => {
    const pageImage = resolveSourceValue(options.image)

    return resolveShareImageUrl({
      pageImage,
      seed: shareImageSeed.value,
      shareImageConfig: shareImageConfig.value,
      siteUrl: siteUrl.value,
      basePath: appBasePath,
      twitter: false
    })
  })
  const robots = computed(() => (
    normalizeMetaText(resolveSourceValue(options.robots))
    || normalizeMetaText(siteSeo.value.robots)
  ))
  const lang = computed(() => (
    normalizeMetaText(resolveSourceValue(options.lang))
    || normalizeMetaText(siteSeo.value.lang)
    || 'zh-CN'
  ))
  const locale = computed(() => normalizeMetaText(siteSeo.value.locale))
  const author = computed(() => normalizeMetaText(siteSeo.value.author))
  const siteStartDate = computed(() => normalizeMetaText(siteSeo.value.siteStartDate))
  const timezone = computed(() => normalizeMetaText(siteSeo.value.timezone))
  const themeColor = computed(() => normalizeMetaText(siteSeo.value.themeColor))
  const faviconHref = computed(() => resolveAssetUrl(siteSeo.value.favicon, {
    siteUrl: siteUrl.value,
    basePath: appBasePath,
    absolute: false
  }))
  const appleTouchIconHref = computed(() => resolveAssetUrl(siteSeo.value.appleTouchIcon, {
    siteUrl: siteUrl.value,
    basePath: appBasePath,
    absolute: false
  }))
  const maskIconHref = computed(() => resolveAssetUrl(siteSeo.value.maskIcon, {
    siteUrl: siteUrl.value,
    basePath: appBasePath,
    absolute: false
  }))
  const maskIconColor = computed(() => normalizeMetaText(siteSeo.value.maskIconColor))
  const twitterImageUrl = computed(() => {
    const pageImage = resolveSourceValue(options.image)

    return resolveShareImageUrl({
      pageImage,
      seed: shareImageSeed.value,
      shareImageConfig: shareImageConfig.value,
      siteUrl: siteUrl.value,
      basePath: appBasePath,
      twitter: true
    })
  })
  const twitterCardType = computed(() => (
    twitterImageUrl.value || imageUrl.value
      ? shareImageConfig.value.twitterCard
      : 'summary'
  ))

  watch(
    [
      pageTitle,
      pageDescription,
      siteTitle,
      siteSubtitle,
      siteDescription,
      absoluteUrl,
      ogType,
      keywords,
      imageUrl,
      twitterImageUrl,
      twitterCardType,
      robots,
      lang,
      locale,
      author,
      siteStartDate,
      timezone,
      themeColor,
      faviconHref,
      appleTouchIconHref,
      maskIconHref,
      maskIconColor
    ],
    ([
      nextPageTitle,
      nextPageDescription,
      nextSiteTitle,
      nextSiteSubtitle,
      nextSiteDescription,
      nextAbsoluteUrl,
      nextOgType,
      nextKeywords,
      nextImageUrl,
      nextTwitterImageUrl,
      nextTwitterCardType,
      nextRobots,
      nextLang,
      nextLocale,
      nextAuthor,
      nextSiteStartDate,
      nextTimezone,
      nextThemeColor,
      nextFaviconHref,
      nextAppleTouchIconHref,
      nextMaskIconHref,
      nextMaskIconColor
    ]) => {
      if (typeof document === 'undefined') {
        return
      }

      const documentTitle = buildDocumentTitle(nextPageTitle, nextSiteTitle)
      if (documentTitle) {
        document.title = documentTitle
      }

      const description = nextPageDescription || nextSiteDescription
      upsertMetaElement({ name: 'description', content: description })
      upsertMetaElement({ name: 'author', content: nextAuthor })
      upsertMetaElement({ name: 'keywords', content: nextKeywords })
      upsertMetaElement({ name: 'application-name', content: nextSiteTitle })
      upsertMetaElement({ name: 'subtitle', content: nextSiteSubtitle })
      upsertMetaElement({ name: 'site-start-date', content: nextSiteStartDate })
      upsertMetaElement({ name: 'timezone', content: nextTimezone })
      upsertMetaElement({ name: 'theme-color', content: nextThemeColor })
      upsertMetaElement({ property: 'og:title', content: documentTitle || nextSiteTitle })
      upsertMetaElement({ property: 'og:site_name', content: nextSiteTitle })
      upsertMetaElement({ property: 'og:description', content: description })
      upsertMetaElement({ property: 'og:locale', content: nextLocale })
      upsertMetaElement({ property: 'og:url', content: nextAbsoluteUrl })
      upsertMetaElement({ property: 'og:type', content: nextOgType })
      upsertMetaElement({ property: 'og:image', content: nextImageUrl })
      upsertMetaElement({ name: 'twitter:title', content: documentTitle || nextSiteTitle })
      upsertMetaElement({ name: 'twitter:description', content: description })
      upsertMetaElement({ name: 'twitter:card', content: nextTwitterCardType })
      upsertMetaElement({ name: 'twitter:image', content: nextTwitterImageUrl || nextImageUrl })
      upsertMetaElement({ name: 'robots', content: nextRobots })
      upsertCanonicalElement(nextAbsoluteUrl)
      upsertLinkElement({ rel: 'icon', href: nextFaviconHref })
      upsertLinkElement({ rel: 'apple-touch-icon', href: nextAppleTouchIconHref })
      upsertLinkElement({
        rel: 'mask-icon',
        href: nextMaskIconHref,
        attributes: {
          color: nextMaskIconColor
        }
      })
      document.documentElement.setAttribute('lang', nextLang || 'zh-CN')
    },
    { immediate: true }
  )
}
