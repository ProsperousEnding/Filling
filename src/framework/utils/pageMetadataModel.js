export function normalizeSiteUrl(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    return ''
  }

  const absoluteUrl = /^https?:\/\//i.test(normalizedValue)
    ? normalizedValue
    : `https://${normalizedValue}`

  return absoluteUrl.replace(/\/+$/, '')
}

export function normalizeBasePath(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue || normalizedValue === '/') {
    return '/'
  }

  return normalizedValue.startsWith('/')
    ? (normalizedValue.endsWith('/') ? normalizedValue : `${normalizedValue}/`)
    : `/${normalizedValue.replace(/\/+$/, '')}/`
}

function joinUrl(base, path) {
  const normalizedBase = normalizeSiteUrl(base)
  const normalizedPath = String(path || '').trim()

  if (!normalizedBase || !normalizedPath || normalizedPath === '/') {
    return normalizedBase
  }

  return `${normalizedBase}/${normalizedPath.replace(/^\/+/, '')}`
}

export function buildBaseRelativeUrl(basePath, assetPath) {
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

export function stripBasePath(path, basePath) {
  const normalizedPath = String(path || '').trim()
  const normalizedBasePath = normalizeBasePath(basePath)

  if (!normalizedPath || normalizedBasePath === '/') {
    return normalizedPath
  }

  const basePrefix = normalizedBasePath.replace(/\/+$/, '')
  const matchesBasePrefix = normalizedPath === basePrefix || normalizedPath.startsWith(`${basePrefix}/`)

  return matchesBasePrefix
    ? normalizedPath.slice(basePrefix.length) || '/'
    : normalizedPath
}

export function buildAbsoluteUrl(siteUrl, basePath, routePath) {
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

export function resolveMetadataAssetUrl(assetPath, {
  siteUrl = '',
  basePath = '/',
  absolute = false
} = {}) {
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

  return absolute && siteUrl
    ? buildAbsoluteUrl(siteUrl, basePath, normalizedAssetPath)
    : buildBaseRelativeUrl(basePath, normalizedAssetPath)
}

export function resolveShareImageUrl({
  pageImage,
  seed,
  shareImageConfig = {},
  siteUrl = '',
  basePath = '/',
  twitter = false,
  createSeededImage = null
} = {}) {
  if (shareImageConfig.enabled === false) {
    return ''
  }

  if (shareImageConfig.preferPageImage !== false) {
    const resolvedPageImage = resolveMetadataAssetUrl(pageImage, {
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
  const resolvedConfiguredImage = resolveMetadataAssetUrl(configuredImage, {
    siteUrl,
    basePath,
    absolute: Boolean(siteUrl)
  })

  if (resolvedConfiguredImage) {
    return resolvedConfiguredImage
  }

  return shareImageConfig.fallback === 'seeded' && typeof createSeededImage === 'function'
    ? createSeededImage(seed, shareImageConfig)
    : ''
}
