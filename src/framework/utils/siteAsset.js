function normalizeString(value) {
  return String(value || '').trim()
}

export function resolveSiteAssetUrl(value, baseUrl = import.meta.env.BASE_URL || '/') {
  const normalizedValue = normalizeString(value)

  if (!normalizedValue) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(normalizedValue) || normalizedValue.startsWith('data:')) {
    return normalizedValue
  }

  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(normalizedValue)) {
    return ''
  }

  const normalizedBaseUrl = normalizeString(baseUrl) || '/'
  const normalizedPath = normalizedValue.replace(/^\.?\//, '').replace(/^\/+/, '')

  return `${normalizedBaseUrl}${normalizedPath}`.replace(/(?<!:)\/{2,}/g, '/')
}
