import {
  DEFAULT_SEEDED_COVER_STYLE,
  DEFAULT_SEEDED_COVER_URLS,
  normalizeSeededCoverStyle
} from './articleCover.js'

const COVER_FALLBACK_VALUES = new Set(['none', 'seeded', 'image'])
const COVER_LOADING_VALUES = new Set(['lazy', 'eager'])
const COVER_OBJECT_FIT_VALUES = new Set(['fill', 'contain', 'cover', 'none', 'scale-down'])
const COVER_PLACEHOLDER_VALUES = new Set(['none', 'gradient', 'icon'])
const COVER_DETAIL_DISPLAY_MODE_VALUES = new Set(['image', 'header-background', 'page-background'])
const COVER_PAGE_BACKGROUND_CONTENT_STYLE_VALUES = new Set(['transparent', 'glass'])
const COVER_WATERMARK_POSITION_VALUES = new Set(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
export const DEFAULT_COVER_CONFIG = Object.freeze({
  enabled: true,
  fallback: 'seeded',
  fallback_image: '',
  image_proxy_url: '',
  fixed: false,
  seeded_width: 1200,
  seeded_height: 630,
  seeded_format: 'webp',
  seeded_style: DEFAULT_SEEDED_COVER_STYLE,
  list: {
    show_cover: true,
    loading: 'lazy',
    aspect_ratio: '',
    object_fit: 'cover',
    placeholder: 'gradient'
  },
  detail: {
    show_cover: true,
    show_related_cover: true,
    display_mode: 'image',
    loading: 'eager',
    aspect_ratio: '',
    object_fit: 'cover',
    placeholder: 'gradient',
    page_background: {
      content_style: 'transparent'
    },
    watermark: {
      enabled: false,
      text: '',
      position: 'bottom-right',
      opacity: 0.72
    }
  }
})

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function transformKeysDeep(value, transformKey) {
  if (Array.isArray(value)) {
    return value.map(item => transformKeysDeep(item, transformKey))
  }

  if (!isPlainObject(value)) {
    return value
  }

  return Object.entries(value).reduce((result, [key, nestedValue]) => {
    result[transformKey(key)] = transformKeysDeep(nestedValue, transformKey)
    return result
  }, {})
}

function toCamelKey(key) {
  return String(key || '').replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function toCamelCase(value) {
  return transformKeysDeep(value, toCamelKey)
}

function normalizeString(value, fallback = '') {
  const normalized = String(value || '').trim()
  return normalized || fallback
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeFallbackMode(value, fallback = DEFAULT_COVER_CONFIG.fallback) {
  const normalized = normalizeString(value).toLowerCase()
  return COVER_FALLBACK_VALUES.has(normalized) ? normalized : fallback
}

function normalizeLoadingMode(value, fallback = DEFAULT_COVER_CONFIG.detail.loading) {
  const normalized = normalizeString(value).toLowerCase()
  return COVER_LOADING_VALUES.has(normalized) ? normalized : fallback
}

function normalizeObjectFit(value, fallback = DEFAULT_COVER_CONFIG.detail.object_fit) {
  const normalized = normalizeString(value).toLowerCase()
  return COVER_OBJECT_FIT_VALUES.has(normalized) ? normalized : fallback
}

function normalizePlaceholder(value, fallback = 'gradient') {
  const normalized = normalizeString(value).toLowerCase()
  return COVER_PLACEHOLDER_VALUES.has(normalized) ? normalized : fallback
}

function normalizeDetailDisplayMode(value, fallback = DEFAULT_COVER_CONFIG.detail.display_mode) {
  const normalized = normalizeString(value).toLowerCase()
  return COVER_DETAIL_DISPLAY_MODE_VALUES.has(normalized) ? normalized : fallback
}

function normalizePageBackgroundContentStyle(value, fallback = DEFAULT_COVER_CONFIG.detail.page_background.content_style) {
  const normalized = normalizeString(value).toLowerCase()
  return COVER_PAGE_BACKGROUND_CONTENT_STYLE_VALUES.has(normalized) ? normalized : fallback
}

function normalizeOpacity(value, fallback) {
  const parsed = Number.parseFloat(value)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(Math.max(parsed, 0), 1)
}

function normalizeWatermarkPosition(value, fallback = DEFAULT_COVER_CONFIG.detail.watermark.position) {
  const normalized = normalizeString(value).toLowerCase()
  return COVER_WATERMARK_POSITION_VALUES.has(normalized) ? normalized : fallback
}

function normalizeStyleUrls(styleUrls = {}, seededAnimeUrl = DEFAULT_COVER_CONFIG.seeded_anime_url) {
  const normalizedStyleUrls = isPlainObject(styleUrls) ? toCamelCase(styleUrls) : {}
  const mergedStyleUrls = {
    ...DEFAULT_SEEDED_COVER_URLS,
    ...normalizedStyleUrls
  }

  if (seededAnimeUrl) {
    mergedStyleUrls.anime = seededAnimeUrl
  }

  return Object.entries(mergedStyleUrls).reduce((result, [key, value]) => {
    const style = normalizeSeededCoverStyle(key, '')
    const source = Array.isArray(value)
      ? [...new Set(value.map(item => normalizeString(item)).filter(Boolean))]
      : normalizeString(value)

    if (style && (Array.isArray(source) ? source.length > 0 : source)) {
      result[style] = source
    }

    return result
  }, {})
}

function normalizeListConfig(list = {}) {
  const normalizedList = isPlainObject(list) ? toCamelCase(list) : {}
  const defaults = DEFAULT_COVER_CONFIG.list

  return {
    showCover: normalizeBoolean(normalizedList.showCover, defaults.show_cover),
    loading: normalizeLoadingMode(normalizedList.loading, defaults.loading),
    aspectRatio: normalizeString(normalizedList.aspectRatio),
    objectFit: normalizeObjectFit(normalizedList.objectFit, defaults.object_fit),
    placeholder: normalizePlaceholder(normalizedList.placeholder, defaults.placeholder)
  }
}

function normalizeWatermarkConfig(watermark = {}) {
  const normalizedWatermark = isPlainObject(watermark) ? toCamelCase(watermark) : {}
  const defaults = DEFAULT_COVER_CONFIG.detail.watermark

  return {
    enabled: normalizeBoolean(normalizedWatermark.enabled, defaults.enabled),
    text: normalizeString(normalizedWatermark.text),
    position: normalizeWatermarkPosition(normalizedWatermark.position, defaults.position),
    opacity: normalizeOpacity(normalizedWatermark.opacity, defaults.opacity)
  }
}

function normalizePageBackgroundConfig(pageBackground = {}) {
  const normalizedPageBackground = isPlainObject(pageBackground) ? toCamelCase(pageBackground) : {}
  const defaults = DEFAULT_COVER_CONFIG.detail.page_background

  return {
    contentStyle: normalizePageBackgroundContentStyle(normalizedPageBackground.contentStyle, defaults.content_style)
  }
}

function normalizeDetailConfig(detail = {}) {
  const normalizedDetail = isPlainObject(detail) ? toCamelCase(detail) : {}
  const defaults = DEFAULT_COVER_CONFIG.detail

  return {
    showCover: normalizeBoolean(normalizedDetail.showCover, defaults.show_cover),
    showRelatedCover: normalizeBoolean(normalizedDetail.showRelatedCover, defaults.show_related_cover),
    displayMode: normalizeDetailDisplayMode(normalizedDetail.displayMode, defaults.display_mode),
    loading: normalizeLoadingMode(normalizedDetail.loading, defaults.loading),
    aspectRatio: normalizeString(normalizedDetail.aspectRatio),
    objectFit: normalizeObjectFit(normalizedDetail.objectFit, defaults.object_fit),
    placeholder: normalizePlaceholder(normalizedDetail.placeholder, defaults.placeholder),
    pageBackground: normalizePageBackgroundConfig(normalizedDetail.pageBackground),
    watermark: normalizeWatermarkConfig(normalizedDetail.watermark)
  }
}

export function normalizeCoverConfig(config = {}) {
  const normalizedConfig = isPlainObject(config) ? toCamelCase(config) : {}
  const requestedSeededStyle = normalizeSeededCoverStyle(
    normalizedConfig.seededStyle,
    DEFAULT_COVER_CONFIG.seeded_style
  )
  const seededAnimeUrl = normalizeString(normalizedConfig.seededAnimeUrl)
  const styleUrls = normalizeStyleUrls(normalizedConfig.sourceUrls || normalizedConfig.styleUrls, seededAnimeUrl)
  const availableStyles = Object.keys(styleUrls)
  const seededStyle = availableStyles.includes(requestedSeededStyle)
    ? requestedSeededStyle
    : DEFAULT_COVER_CONFIG.seeded_style
  return {
    enabled: normalizeBoolean(normalizedConfig.enabled, DEFAULT_COVER_CONFIG.enabled),
    fallback: normalizeFallbackMode(normalizedConfig.fallback),
    fallbackImage: normalizeString(normalizedConfig.fallbackImage || normalizedConfig.image),
    imageProxyUrl: normalizeString(normalizedConfig.imageProxyUrl),
    fixed: normalizeBoolean(normalizedConfig.fixed, DEFAULT_COVER_CONFIG.fixed),
    seededWidth: normalizePositiveInteger(normalizedConfig.seededWidth, DEFAULT_COVER_CONFIG.seeded_width),
    seededHeight: normalizePositiveInteger(normalizedConfig.seededHeight, DEFAULT_COVER_CONFIG.seeded_height),
    seededFormat: normalizeString(normalizedConfig.seededFormat, DEFAULT_COVER_CONFIG.seeded_format),
    seededStyle,
    seededAnimeUrl,
    styleUrls,
    sourceUrls: styleUrls,
    list: normalizeListConfig(normalizedConfig.list),
    detail: normalizeDetailConfig(normalizedConfig.detail)
  }
}
