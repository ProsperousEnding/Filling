import { resolveThemeAssetUrl } from './themeAsset.js'

const BACKGROUND_MODE_VALUES = new Set(['none', 'gradient', 'image'])

export const DEFAULT_BACKGROUND_CONFIG = Object.freeze({
  enabled: false,
  mode: 'gradient',
  gradient_light: 'radial-gradient(72rem 42rem at 0% 0%, rgba(59, 130, 246, 0.14), transparent 56%), radial-gradient(56rem 34rem at 100% 8%, rgba(16, 185, 129, 0.1), transparent 48%), linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(255, 255, 255, 0.98) 38%, rgba(248, 250, 252, 0.94) 100%)',
  gradient_dark: 'radial-gradient(72rem 42rem at 0% 0%, rgba(37, 99, 235, 0.18), transparent 54%), radial-gradient(54rem 32rem at 100% 10%, rgba(14, 165, 233, 0.12), transparent 46%), linear-gradient(180deg, rgba(2, 6, 23, 0.98) 0%, rgba(15, 23, 42, 0.98) 42%, rgba(15, 23, 42, 0.94) 100%)',
  image: '',
  dark_image: '',
  overlay_light: 'none',
  overlay_dark: 'none',
  position: 'center top',
  size: 'cover',
  repeat: 'no-repeat',
  attachment: 'scroll',
  opacity: 1
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

function normalizeMode(value, fallback = DEFAULT_BACKGROUND_CONFIG.mode) {
  const normalized = normalizeString(value).toLowerCase()
  return BACKGROUND_MODE_VALUES.has(normalized) ? normalized : fallback
}

function normalizeOpacity(value, fallback = DEFAULT_BACKGROUND_CONFIG.opacity) {
  const numeric = Number.parseFloat(value)

  if (!Number.isFinite(numeric)) {
    return fallback
  }

  if (numeric <= 0) {
    return 0
  }

  if (numeric >= 1) {
    return 1
  }

  return numeric
}

function resolveBackgroundLayer(config, tone, baseUrl) {
  if (config.mode === 'image') {
    const source = tone === 'dark'
      ? config.darkImage || config.image
      : config.image
    const resolvedUrl = resolveThemeAssetUrl(source, baseUrl)

    return resolvedUrl ? `url("${resolvedUrl}")` : 'none'
  }

  if (config.mode === 'gradient') {
    return tone === 'dark'
      ? config.gradientDark || config.gradientLight || DEFAULT_BACKGROUND_CONFIG.gradient_dark
      : config.gradientLight || DEFAULT_BACKGROUND_CONFIG.gradient_light
  }

  return 'none'
}

export function normalizeBackgroundConfig(config = {}) {
  const normalizedConfig = isPlainObject(config) ? toCamelCase(config) : {}
  const mode = normalizeMode(normalizedConfig.mode)

  return {
    enabled: typeof normalizedConfig.enabled === 'boolean'
      ? normalizedConfig.enabled
      : DEFAULT_BACKGROUND_CONFIG.enabled,
    mode,
    gradientLight: normalizeString(normalizedConfig.gradientLight, DEFAULT_BACKGROUND_CONFIG.gradient_light),
    gradientDark: normalizeString(normalizedConfig.gradientDark, DEFAULT_BACKGROUND_CONFIG.gradient_dark),
    image: normalizeString(normalizedConfig.image),
    darkImage: normalizeString(normalizedConfig.darkImage || normalizedConfig.imageDark),
    overlayLight: normalizeString(normalizedConfig.overlayLight, DEFAULT_BACKGROUND_CONFIG.overlay_light),
    overlayDark: normalizeString(normalizedConfig.overlayDark, DEFAULT_BACKGROUND_CONFIG.overlay_dark),
    position: normalizeString(normalizedConfig.position, DEFAULT_BACKGROUND_CONFIG.position),
    size: normalizeString(normalizedConfig.size, DEFAULT_BACKGROUND_CONFIG.size),
    repeat: normalizeString(normalizedConfig.repeat, DEFAULT_BACKGROUND_CONFIG.repeat),
    attachment: normalizeString(normalizedConfig.attachment, DEFAULT_BACKGROUND_CONFIG.attachment),
    opacity: normalizeOpacity(normalizedConfig.opacity, DEFAULT_BACKGROUND_CONFIG.opacity)
  }
}

export function buildBackgroundCssVars(config = {}, baseUrl = '/') {
  const normalizedConfig = normalizeBackgroundConfig(config)
  const isActive = normalizedConfig.enabled && normalizedConfig.mode !== 'none'

  return {
    '--site-background-layer-light': isActive
      ? resolveBackgroundLayer(normalizedConfig, 'light', baseUrl)
      : 'none',
    '--site-background-layer-dark': isActive
      ? resolveBackgroundLayer(normalizedConfig, 'dark', baseUrl)
      : 'none',
    '--site-background-overlay-light': isActive
      ? normalizedConfig.overlayLight || 'none'
      : 'none',
    '--site-background-overlay-dark': isActive
      ? normalizedConfig.overlayDark || normalizedConfig.overlayLight || 'none'
      : 'none',
    '--site-background-position': normalizedConfig.position,
    '--site-background-size': normalizedConfig.size,
    '--site-background-repeat': normalizedConfig.repeat,
    '--site-background-attachment': normalizedConfig.attachment,
    '--site-background-opacity': String(isActive ? normalizedConfig.opacity : 0)
  }
}

export function buildBackgroundCssText(config = {}, baseUrl = '/') {
  return Object.entries(buildBackgroundCssVars(config, baseUrl))
    .map(([name, value]) => `${name}: ${value};`)
    .join(' ')
}
