import { normalizeThemeAssetPath, resolveThemeAssetUrl } from './themeAsset.js'

const FONT_STYLE_VALUES = new Set(['normal', 'italic', 'oblique'])
const FONT_DISPLAY_VALUES = new Set(['auto', 'block', 'swap', 'fallback', 'optional'])
const FONT_PRELOAD_VALUES = new Set(['marked', 'all', 'none'])
const FONT_MIME_BY_EXTENSION = Object.freeze({
  woff2: 'font/woff2',
  woff: 'font/woff',
  ttf: 'font/ttf',
  otf: 'font/otf'
})
const FONT_FORMAT_BY_EXTENSION = Object.freeze({
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype'
})

const SYSTEM_FONT_FAMILIES = Object.freeze({
  sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
  heading: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
  serif: "'New York', Georgia, serif",
  mono: "'SF Mono', SFMono-Regular, ui-monospace, Menlo, monospace"
})

export const BUILT_IN_FONT_PRESETS = Object.freeze({
  system: Object.freeze({
    label: 'System',
    base_size: '16px',
    families: SYSTEM_FONT_FAMILIES,
    faces: Object.freeze([])
  }),
  sans: Object.freeze({
    label: 'Sans',
    base_size: '16px',
    families: Object.freeze({
      sans: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", ui-sans-serif, system-ui, sans-serif',
      heading: '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", ui-sans-serif, system-ui, sans-serif',
      serif: '"Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", Georgia, serif',
      mono: '"JetBrains Mono", "SF Mono", SFMono-Regular, ui-monospace, Menlo, Consolas, monospace'
    }),
    faces: Object.freeze([])
  }),
  serif: Object.freeze({
    label: 'Serif',
    base_size: '17px',
    families: Object.freeze({
      sans: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", ui-sans-serif, system-ui, sans-serif',
      heading: '"Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", Georgia, serif',
      serif: '"Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", Georgia, serif',
      mono: '"JetBrains Mono", "SF Mono", SFMono-Regular, ui-monospace, Menlo, Consolas, monospace'
    }),
    faces: Object.freeze([])
  }),
  mono: Object.freeze({
    label: 'Mono',
    base_size: '16px',
    families: Object.freeze({
      sans: '"JetBrains Mono", "SF Mono", SFMono-Regular, ui-monospace, Menlo, Consolas, monospace',
      heading: '"JetBrains Mono", "SF Mono", SFMono-Regular, ui-monospace, Menlo, Consolas, monospace',
      serif: '"Noto Serif CJK SC", "Source Han Serif SC", Georgia, serif',
      mono: '"JetBrains Mono", "SF Mono", SFMono-Regular, ui-monospace, Menlo, Consolas, monospace'
    }),
    faces: Object.freeze([])
  })
})

export const DEFAULT_FONT_CONFIG = Object.freeze({
  enabled: false,
  preset: 'system',
  current_preset: 'system',
  preload: 'marked',
  base_size: '16px',
  families: SYSTEM_FONT_FAMILIES,
  dark_families: Object.freeze({}),
  presets: Object.freeze({}),
  faces: Object.freeze([])
})

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function normalizeCssToken(value) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[{}]/g, '')
    .trim()
}

function normalizeFontFamilyStack(value, fallback = '') {
  return normalizeCssToken(value).replace(/;/g, '') || fallback
}

function normalizeFontBaseSize(value, fallback = DEFAULT_FONT_CONFIG.base_size) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return `${value}px`
  }

  const normalizedValue = normalizeCssToken(value).replace(/;/g, '')

  if (!normalizedValue) {
    return fallback
  }

  if (/^\d+(\.\d+)?$/.test(normalizedValue)) {
    return `${normalizedValue}px`
  }

  return normalizedValue
}

function normalizeFontPreloadStrategy(value, fallback = DEFAULT_FONT_CONFIG.preload) {
  if (value === true) {
    return 'all'
  }

  if (value === false) {
    return 'none'
  }

  const normalizedValue = normalizeCssToken(value).toLowerCase()
  return FONT_PRELOAD_VALUES.has(normalizedValue) ? normalizedValue : fallback
}

function normalizeFontWeight(value, fallback = '400') {
  const normalizedValue = normalizeCssToken(value).replace(/;/g, '')
  return normalizedValue || fallback
}

function normalizeFontStyle(value, fallback = 'normal') {
  const normalizedValue = normalizeCssToken(value).toLowerCase()
  return FONT_STYLE_VALUES.has(normalizedValue) ? normalizedValue : fallback
}

function normalizeFontDisplay(value, fallback = 'swap') {
  const normalizedValue = normalizeCssToken(value).toLowerCase()
  return FONT_DISPLAY_VALUES.has(normalizedValue) ? normalizedValue : fallback
}

function normalizeFontMimeType(value, src = '') {
  const normalizedValue = normalizeCssToken(value)

  if (normalizedValue) {
    return normalizedValue
  }

  const extension = String(src || '').trim().split('.').pop()?.toLowerCase() || ''
  return FONT_MIME_BY_EXTENSION[extension] || ''
}

function normalizeFontFormat(value, src = '') {
  const normalizedValue = normalizeCssToken(value).replace(/['"]/g, '')

  if (normalizedValue) {
    return normalizedValue
  }

  const extension = String(src || '').trim().split('.').pop()?.toLowerCase() || ''
  return FONT_FORMAT_BY_EXTENSION[extension] || ''
}

function resolveFontFacePreload(face, preloadStrategy) {
  if (preloadStrategy === 'none') {
    return false
  }

  if (typeof face.preload === 'boolean') {
    return face.preload
  }

  return preloadStrategy === 'all'
}

function normalizeFontFace(face = {}, index = 0, preloadStrategy = DEFAULT_FONT_CONFIG.preload) {
  if (!isPlainObject(face)) {
    return null
  }

  const family = normalizeFontFamilyStack(face.family || face.name)
  const src = normalizeThemeAssetPath(face.src || face.file || face.path || '')

  if (!family || !src) {
    return null
  }

  const preload = resolveFontFacePreload(face, preloadStrategy)
  const unicodeRange = normalizeCssToken(face.unicode_range || face.unicodeRange).replace(/;/g, '')

  return {
    id: String(face.id || `font-face-${index}`).trim(),
    family,
    src,
    weight: normalizeFontWeight(face.weight, '400'),
    style: normalizeFontStyle(face.style, 'normal'),
    display: normalizeFontDisplay(face.display, 'swap'),
    preload,
    type: normalizeFontMimeType(face.type || face.mime_type || face.mimeType, src),
    format: normalizeFontFormat(face.format, src),
    unicodeRange
  }
}

function normalizeFontFamilies(source = {}, fallback = DEFAULT_FONT_CONFIG.families) {
  const normalizedSource = isPlainObject(source) ? source : {}
  const fallbackFamilies = isPlainObject(fallback) ? fallback : DEFAULT_FONT_CONFIG.families
  const sansFamily = normalizeFontFamilyStack(
    normalizedSource.sans
    || normalizedSource.sans_family
    || normalizedSource.sansFamily,
    fallbackFamilies.sans || DEFAULT_FONT_CONFIG.families.sans
  )

  return {
    sans: sansFamily,
    heading: normalizeFontFamilyStack(
      normalizedSource.heading
      || normalizedSource.display
      || normalizedSource.heading_family
      || normalizedSource.headingFamily
      || normalizedSource.display_family
      || normalizedSource.displayFamily,
      sansFamily || fallbackFamilies.heading || DEFAULT_FONT_CONFIG.families.heading
    ),
    serif: normalizeFontFamilyStack(
      normalizedSource.serif
      || normalizedSource.serif_family
      || normalizedSource.serifFamily,
      fallbackFamilies.serif || DEFAULT_FONT_CONFIG.families.serif
    ),
    mono: normalizeFontFamilyStack(
      normalizedSource.mono
      || normalizedSource.mono_family
      || normalizedSource.monoFamily,
      fallbackFamilies.mono || DEFAULT_FONT_CONFIG.families.mono
    )
  }
}

function normalizeOptionalFontFamilies(source = {}) {
  const normalizedSource = isPlainObject(source) ? source : {}

  return ['sans', 'heading', 'serif', 'mono'].reduce((result, key) => {
    const aliases = key === 'heading'
      ? ['heading', 'display', 'heading_family', 'headingFamily', 'display_family', 'displayFamily']
      : [key, `${key}_family`, `${key}Family`]
    const value = aliases
      .map(alias => normalizedSource[alias])
      .find(aliasValue => typeof aliasValue === 'string' && aliasValue.trim())

    if (value) {
      result[key] = normalizeFontFamilyStack(value)
    }

    return result
  }, {})
}

function normalizeFontFaces(faces = [], preloadStrategy = DEFAULT_FONT_CONFIG.preload) {
  if (!Array.isArray(faces)) {
    return []
  }

  return faces
    .map((face, index) => normalizeFontFace(face, index, preloadStrategy))
    .filter(Boolean)
}

function normalizeFontPresetName(value, fallback = DEFAULT_FONT_CONFIG.current_preset) {
  const normalizedValue = String(value || '').trim()
  return normalizedValue || fallback
}

function normalizeFontPresetConfig(preset = {}) {
  if (!isPlainObject(preset)) {
    return null
  }

  return {
    label: String(preset.label || preset.name || '').trim(),
    baseSize: normalizeFontBaseSize(preset.base_size ?? preset.baseSize, ''),
    preload: normalizeFontPreloadStrategy(preset.preload, ''),
    families: normalizeFontFamilies(preset.families, DEFAULT_FONT_CONFIG.families),
    darkFamilies: normalizeOptionalFontFamilies(preset.dark_families || preset.darkFamilies),
    faces: Array.isArray(preset.faces) ? preset.faces : []
  }
}

function normalizeFontPresets(presets = {}) {
  if (!isPlainObject(presets)) {
    return {}
  }

  return Object.entries(presets).reduce((result, [name, preset]) => {
    const presetName = String(name || '').trim()
    const normalizedPreset = normalizeFontPresetConfig(preset)

    if (presetName && normalizedPreset) {
      result[presetName] = normalizedPreset
    }

    return result
  }, {})
}

function resolveFontPreset(presetName, customPresets) {
  if (isPlainObject(customPresets[presetName])) {
    return {
      name: presetName,
      config: customPresets[presetName]
    }
  }

  const normalizedPresetName = String(presetName || '').trim().toLowerCase()

  if (isPlainObject(BUILT_IN_FONT_PRESETS[normalizedPresetName])) {
    return {
      name: normalizedPresetName,
      config: normalizeFontPresetConfig(BUILT_IN_FONT_PRESETS[normalizedPresetName])
    }
  }

  const customPresetName = Object.keys(customPresets)
    .find(name => name.toLowerCase() === normalizedPresetName)

  if (customPresetName) {
    return {
      name: customPresetName,
      config: customPresets[customPresetName]
    }
  }

  return {
    name: DEFAULT_FONT_CONFIG.current_preset,
    config: normalizeFontPresetConfig(BUILT_IN_FONT_PRESETS[DEFAULT_FONT_CONFIG.current_preset])
  }
}

export function normalizeFontConfig(config = {}) {
  const normalizedConfig = isPlainObject(config) ? config : {}
  const customPresets = normalizeFontPresets(normalizedConfig.presets)
  const requestedPresetName = normalizeFontPresetName(
    normalizedConfig.current_preset
    || normalizedConfig.currentPreset
    || normalizedConfig.preset
  )
  const activePreset = resolveFontPreset(requestedPresetName, customPresets)
  const activePresetConfig = activePreset.config || normalizeFontPresetConfig(BUILT_IN_FONT_PRESETS.system)
  const preload = normalizeFontPreloadStrategy(
    normalizedConfig.preload,
    activePresetConfig.preload || DEFAULT_FONT_CONFIG.preload
  )
  const topLevelFamilies = {
    ...(isPlainObject(normalizedConfig.families) ? normalizedConfig.families : {}),
    sans_family: normalizedConfig.sans_family,
    sansFamily: normalizedConfig.sansFamily,
    heading_family: normalizedConfig.heading_family,
    headingFamily: normalizedConfig.headingFamily,
    display_family: normalizedConfig.display_family,
    displayFamily: normalizedConfig.displayFamily,
    serif_family: normalizedConfig.serif_family,
    serifFamily: normalizedConfig.serifFamily,
    mono_family: normalizedConfig.mono_family,
    monoFamily: normalizedConfig.monoFamily
  }
  const families = normalizeFontFamilies(topLevelFamilies, activePresetConfig.families)
  const darkFamilies = normalizeOptionalFontFamilies({
    ...(activePresetConfig.darkFamilies || {}),
    ...(isPlainObject(normalizedConfig.dark_families) ? normalizedConfig.dark_families : {}),
    ...(isPlainObject(normalizedConfig.darkFamilies) ? normalizedConfig.darkFamilies : {})
  })
  const faces = [
    ...normalizeFontFaces(activePresetConfig.faces, preload),
    ...normalizeFontFaces(normalizedConfig.faces, preload)
  ]
  const baseSize = normalizeFontBaseSize(
    normalizedConfig.base_size ?? normalizedConfig.baseSize,
    activePresetConfig.baseSize || DEFAULT_FONT_CONFIG.base_size
  )
  const enabled = normalizedConfig.enabled === true

  return {
    enabled,
    preset: activePreset.name,
    currentPreset: activePreset.name,
    preload,
    baseSize,
    families,
    darkFamilies,
    presets: customPresets,
    faces
  }
}

function escapeCssValue(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
}

function buildFontFaceCss(face, baseUrl = '/') {
  const href = resolveThemeAssetUrl(face.src, baseUrl)

  if (!href) {
    return ''
  }

  const formatSuffix = face.format ? ` format("${escapeCssValue(face.format)}")` : ''
  const unicodeRangeLine = face.unicodeRange
    ? `  unicode-range: ${face.unicodeRange};\n`
    : ''

  return `@font-face {\n`
    + `  font-family: "${escapeCssValue(face.family)}";\n`
    + `  src: url("${escapeCssValue(href)}")${formatSuffix};\n`
    + `  font-style: ${face.style};\n`
    + `  font-weight: ${face.weight};\n`
    + `  font-display: ${face.display};\n`
    + unicodeRangeLine
    + `}`
}

export function buildFontConfigCss(fontConfig = {}, baseUrl = '/') {
  const normalizedFontConfig = fontConfig?.families
    ? fontConfig
    : normalizeFontConfig(fontConfig)

  if (!normalizedFontConfig.enabled) {
    return ''
  }

  const fontFaceCss = normalizedFontConfig.faces
    .map(face => buildFontFaceCss(face, baseUrl))
    .filter(Boolean)
    .join('\n\n')
  const rootCss = `:root {\n`
    + `  --font-sans: ${normalizedFontConfig.families.sans};\n`
    + `  --font-heading: ${normalizedFontConfig.families.heading || normalizedFontConfig.families.sans};\n`
    + `  --font-serif: ${normalizedFontConfig.families.serif};\n`
    + `  --font-mono: ${normalizedFontConfig.families.mono};\n`
    + `  --font-root-size: ${normalizedFontConfig.baseSize};\n`
    + `}`
  const darkFamilies = normalizedFontConfig.darkFamilies || {}
  const darkFamilyCss = Object.entries({
    sans: darkFamilies.sans,
    heading: darkFamilies.heading,
    serif: darkFamilies.serif,
    mono: darkFamilies.mono
  })
    .filter(([, value]) => value)
    .map(([key, value]) => `  --font-${key}: ${value};`)
    .join('\n')
  const darkCss = darkFamilyCss ? `.dark {\n${darkFamilyCss}\n}` : ''

  return [fontFaceCss, rootCss, darkCss].filter(Boolean).join('\n\n')
}

export function resolveFontPreloadLinks(fontConfig = {}, baseUrl = '/') {
  const normalizedFontConfig = fontConfig?.families
    ? fontConfig
    : normalizeFontConfig(fontConfig)

  if (!normalizedFontConfig.enabled) {
    return []
  }

  const seen = new Set()

  return normalizedFontConfig.faces
    .filter(face => face.preload)
    .map((face) => {
      const href = resolveThemeAssetUrl(face.src, baseUrl)

      if (!href || seen.has(href)) {
        return null
      }

      seen.add(href)

      return {
        href,
        type: face.type || '',
        crossorigin: 'anonymous'
      }
    })
    .filter(Boolean)
}
