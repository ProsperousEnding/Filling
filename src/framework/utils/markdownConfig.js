const DEFAULT_CALLOUT_LABELS = Object.freeze({
  note: '注意',
  tip: '提示',
  important: '重要',
  warning: '警告',
  caution: '危险',
  info: '信息',
  success: '成功',
  danger: '错误'
})

const DEFAULT_CALLOUT_ICONS = Object.freeze({
  note: 'i',
  tip: '>',
  important: '!',
  warning: '!',
  caution: 'x',
  info: 'i',
  success: '+',
  danger: 'x'
})

const DEFAULT_CALLOUT_ALIASES = Object.freeze({
  warn: 'warning',
  error: 'danger',
  failure: 'danger',
  fail: 'danger',
  question: 'info',
  help: 'info',
  check: 'success',
  done: 'success'
})

const CALLOUT_SYNTAX_VALUES = new Set(['github'])
const MERMAID_THEME_VALUES = new Set(['default', 'base', 'dark', 'forest', 'neutral'])
const MERMAID_SECURITY_LEVEL_VALUES = new Set(['strict', 'loose', 'antiscript', 'sandbox'])
const MATH_ENGINE_VALUES = new Set(['katex'])
const KATEX_STRICT_VALUES = new Set(['warn', 'ignore', 'error', 'false', 'true'])

export const DEFAULT_MARKDOWN_CONFIG = Object.freeze({
  enabled: true,
  callouts: Object.freeze({
    enabled: true,
    syntax: 'github',
    default_type: 'note',
    show_icon: true,
    labels: DEFAULT_CALLOUT_LABELS,
    icons: DEFAULT_CALLOUT_ICONS,
    aliases: DEFAULT_CALLOUT_ALIASES
  }),
  mermaid: Object.freeze({
    enabled: false,
    render: true,
    script_url: 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js',
    theme: 'default',
    dark_theme: 'dark',
    security_level: 'strict'
  }),
  math: Object.freeze({
    enabled: false,
    render: true,
    engine: 'katex',
    script_url: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js',
    css_url: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
    inline_dollar: true,
    inline_parentheses: true,
    block_dollar: true,
    block_brackets: true,
    throw_on_error: false,
    error_color: '#dc2626',
    strict: 'warn'
  })
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

function normalizeUrl(value, fallback = '') {
  const normalized = normalizeString(value)

  if (!normalized) {
    return fallback
  }

  if (/^\s*(?:javascript|vbscript|data):/i.test(normalized)) {
    return fallback
  }

  return normalized
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeCalloutMap(value = {}, fallback = {}) {
  const source = isPlainObject(value) ? value : {}
  const fallbackSource = isPlainObject(fallback) ? fallback : {}

  return Object.entries({
    ...fallbackSource,
    ...source
  }).reduce((result, [key, mapValue]) => {
    const normalizedKey = String(key || '').trim().toLowerCase()
    const normalizedValue = normalizeString(mapValue)

    if (normalizedKey && normalizedValue) {
      result[normalizedKey] = normalizedValue
    }

    return result
  }, {})
}

function normalizeCalloutSyntax(value, fallback = DEFAULT_MARKDOWN_CONFIG.callouts.syntax) {
  const normalized = normalizeString(value, fallback).toLowerCase()
  return CALLOUT_SYNTAX_VALUES.has(normalized) ? normalized : fallback
}

function normalizeDefaultCalloutType(value, labels) {
  const normalized = normalizeString(value, DEFAULT_MARKDOWN_CONFIG.callouts.default_type).toLowerCase()
  return labels[normalized] ? normalized : DEFAULT_MARKDOWN_CONFIG.callouts.default_type
}

function normalizeCalloutConfig(callouts = {}, markdownEnabled = true) {
  const source = isPlainObject(callouts) ? toCamelCase(callouts) : {}
  const labels = normalizeCalloutMap(source.labels, DEFAULT_MARKDOWN_CONFIG.callouts.labels)
  const icons = normalizeCalloutMap(source.icons, DEFAULT_MARKDOWN_CONFIG.callouts.icons)
  const aliases = normalizeCalloutMap(source.aliases, DEFAULT_MARKDOWN_CONFIG.callouts.aliases)

  return {
    enabled: markdownEnabled && normalizeBoolean(source.enabled, DEFAULT_MARKDOWN_CONFIG.callouts.enabled),
    syntax: normalizeCalloutSyntax(source.syntax, DEFAULT_MARKDOWN_CONFIG.callouts.syntax),
    defaultType: normalizeDefaultCalloutType(source.defaultType, labels),
    showIcon: normalizeBoolean(source.showIcon, DEFAULT_MARKDOWN_CONFIG.callouts.show_icon),
    labels,
    icons,
    aliases
  }
}

function normalizeEnumValue(value, allowedValues, fallback) {
  const normalized = normalizeString(value, fallback).toLowerCase()
  return allowedValues.has(normalized) ? normalized : fallback
}

function normalizeMermaidConfig(mermaid = {}, markdownEnabled = true) {
  const source = isPlainObject(mermaid) ? toCamelCase(mermaid) : {}
  const defaultMermaid = DEFAULT_MARKDOWN_CONFIG.mermaid

  return {
    enabled: markdownEnabled && normalizeBoolean(source.enabled, defaultMermaid.enabled),
    render: normalizeBoolean(source.render, defaultMermaid.render),
    scriptUrl: normalizeUrl(source.scriptUrl, defaultMermaid.script_url),
    theme: normalizeEnumValue(source.theme, MERMAID_THEME_VALUES, defaultMermaid.theme),
    darkTheme: normalizeEnumValue(source.darkTheme, MERMAID_THEME_VALUES, defaultMermaid.dark_theme),
    securityLevel: normalizeEnumValue(
      source.securityLevel,
      MERMAID_SECURITY_LEVEL_VALUES,
      defaultMermaid.security_level
    )
  }
}

function normalizeKatexStrict(value, fallback = DEFAULT_MARKDOWN_CONFIG.math.strict) {
  if (typeof value === 'boolean') {
    return value
  }

  const normalized = normalizeString(value, fallback).toLowerCase()

  if (!KATEX_STRICT_VALUES.has(normalized)) {
    return fallback
  }

  if (normalized === 'true') {
    return true
  }

  if (normalized === 'false') {
    return false
  }

  return normalized
}

function normalizeMathConfig(math = {}, markdownEnabled = true) {
  const source = isPlainObject(math) ? toCamelCase(math) : {}
  const defaultMath = DEFAULT_MARKDOWN_CONFIG.math

  return {
    enabled: markdownEnabled && normalizeBoolean(source.enabled, defaultMath.enabled),
    render: normalizeBoolean(source.render, defaultMath.render),
    engine: normalizeEnumValue(source.engine, MATH_ENGINE_VALUES, defaultMath.engine),
    scriptUrl: normalizeUrl(source.scriptUrl, defaultMath.script_url),
    cssUrl: normalizeUrl(source.cssUrl, defaultMath.css_url),
    inlineDollar: normalizeBoolean(source.inlineDollar, defaultMath.inline_dollar),
    inlineParentheses: normalizeBoolean(source.inlineParentheses, defaultMath.inline_parentheses),
    blockDollar: normalizeBoolean(source.blockDollar, defaultMath.block_dollar),
    blockBrackets: normalizeBoolean(source.blockBrackets, defaultMath.block_brackets),
    throwOnError: normalizeBoolean(source.throwOnError, defaultMath.throw_on_error),
    errorColor: normalizeString(source.errorColor, defaultMath.error_color),
    strict: normalizeKatexStrict(source.strict, defaultMath.strict)
  }
}

export function normalizeMarkdownConfig(config = {}) {
  const source = isPlainObject(config) ? toCamelCase(config) : {}
  const enabled = normalizeBoolean(source.enabled, DEFAULT_MARKDOWN_CONFIG.enabled)

  return {
    enabled,
    callouts: normalizeCalloutConfig(source.callouts, enabled),
    mermaid: normalizeMermaidConfig(source.mermaid, enabled),
    math: normalizeMathConfig(source.math, enabled)
  }
}
