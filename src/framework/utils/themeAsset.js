function normalizeString(value) {
  return String(value || '').trim()
}

function isUnsafeThemeAssetPath(value) {
  const normalizedValue = normalizeString(value)

  if (!normalizedValue) {
    return false
  }

  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(normalizedValue)
}

export function normalizeThemeAssetPath(value) {
  const normalizedValue = normalizeString(value)

  if (!normalizedValue || isUnsafeThemeAssetPath(normalizedValue)) {
    return ''
  }

  return normalizedValue.replace(/^\.?\//, '')
}

export function resolveThemeAssetUrl(value, baseUrl = '/') {
  const normalizedPath = normalizeThemeAssetPath(value)

  if (!normalizedPath) {
    return ''
  }

  const normalizedBaseUrl = normalizeString(baseUrl) || '/'

  return `${normalizedBaseUrl}${normalizedPath}`.replace(/(?<!:)\/{2,}/g, '/')
}

export function isThemeAssetPathAllowed(value) {
  return Boolean(normalizeThemeAssetPath(value))
}
