export const DEFAULT_CODE_BLOCK_CONFIG = Object.freeze({
  enabled: true,
  show_language: true,
  show_filename: true,
  show_copy_button: true,
  show_line_numbers: true,
  line_number_start: 1,
  theme: 'default',
  dark_theme: 'default',
  copy_label: '复制代码',
  copied_label: '已复制',
  wrap_long_lines: false,
  max_height: '',
  collapsible: true,
  collapse_threshold_lines: 18,
  preview_lines: 18,
  expand_label: '展开代码',
  collapse_label: '收起代码',
  mark_diff_lines: true,
  languages: Object.freeze({})
})

const LANGUAGE_LABELS = Object.freeze({
  js: 'JavaScript',
  javascript: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  tsx: 'TSX',
  vue: 'Vue',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  less: 'Less',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  bash: 'Bash',
  sh: 'Shell',
  zsh: 'Zsh',
  shell: 'Shell',
  toml: 'TOML',
  md: 'Markdown',
  markdown: 'Markdown',
  diff: 'Diff',
  text: 'Text',
  txt: 'Text',
  python: 'Python',
  py: 'Python',
  go: 'Go',
  rust: 'Rust',
  rs: 'Rust',
  java: 'Java',
  kotlin: 'Kotlin',
  c: 'C',
  cpp: 'C++',
  cxx: 'C++',
  csharp: 'C#',
  cs: 'C#',
  php: 'PHP',
  ruby: 'Ruby',
  rb: 'Ruby',
  sql: 'SQL'
})
const LANGUAGE_ALIASES = Object.freeze({
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'tsx',
  yml: 'yaml',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  md: 'markdown',
  txt: 'text',
  patch: 'diff',
  dockerfile: 'dockerfile'
})

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function isNormalizedCodeBlockConfig(value) {
  return isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, 'showLanguage')
}

function normalizeText(value, fallback = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim() || fallback
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizePositiveInteger(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeCssSize(value) {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue) {
    return ''
  }

  return /^\d+(\.\d+)?$/.test(normalizedValue)
    ? `${normalizedValue}px`
    : normalizedValue
}

function normalizeTheme(value, fallback = 'default') {
  const normalizedValue = normalizeText(value).toLowerCase()
  const allowedThemes = new Set(['default', 'github', 'dracula'])

  return allowedThemes.has(normalizedValue) ? normalizedValue : fallback
}

function readConfigValue(source = {}, snakeKey, camelKey, fallback = {}) {
  return source?.[snakeKey]
    ?? source?.[camelKey]
    ?? fallback?.[camelKey]
    ?? fallback?.[snakeKey]
}

function normalizeCodeBlockSettings(config = {}, fallback = DEFAULT_CODE_BLOCK_CONFIG) {
  const fallbackCollapseThreshold = normalizePositiveInteger(
    fallback.collapseThresholdLines ?? fallback.collapse_threshold_lines,
    DEFAULT_CODE_BLOCK_CONFIG.collapse_threshold_lines
  )
  const rawCollapseThreshold = config.collapse_threshold_lines ?? config.collapseThresholdLines
  const collapseThresholdLines = normalizePositiveInteger(
    readConfigValue(config, 'collapse_threshold_lines', 'collapseThresholdLines', fallback),
    fallbackCollapseThreshold
  )
  const fallbackPreviewLines = rawCollapseThreshold !== undefined && rawCollapseThreshold !== null
    ? collapseThresholdLines
    : normalizePositiveInteger(
      fallback.previewLines ?? fallback.preview_lines,
      collapseThresholdLines
    )

  return {
    enabled: normalizeBoolean(
      readConfigValue(config, 'enabled', 'enabled', fallback),
      DEFAULT_CODE_BLOCK_CONFIG.enabled
    ),
    showLanguage: normalizeBoolean(
      readConfigValue(config, 'show_language', 'showLanguage', fallback),
      DEFAULT_CODE_BLOCK_CONFIG.show_language
    ),
    showFilename: normalizeBoolean(
      readConfigValue(config, 'show_filename', 'showFilename', fallback),
      DEFAULT_CODE_BLOCK_CONFIG.show_filename
    ),
    showCopyButton: normalizeBoolean(
      readConfigValue(config, 'show_copy_button', 'showCopyButton', fallback),
      DEFAULT_CODE_BLOCK_CONFIG.show_copy_button
    ),
    showLineNumbers: normalizeBoolean(
      readConfigValue(config, 'show_line_numbers', 'showLineNumbers', fallback),
      DEFAULT_CODE_BLOCK_CONFIG.show_line_numbers
    ),
    lineNumberStart: normalizePositiveInteger(
      readConfigValue(config, 'line_number_start', 'lineNumberStart', fallback),
      DEFAULT_CODE_BLOCK_CONFIG.line_number_start
    ),
    theme: normalizeTheme(
      readConfigValue(config, 'theme', 'theme', fallback),
      fallback.theme ?? DEFAULT_CODE_BLOCK_CONFIG.theme
    ),
    darkTheme: normalizeTheme(
      readConfigValue(config, 'dark_theme', 'darkTheme', fallback),
      fallback.darkTheme ?? fallback.dark_theme ?? DEFAULT_CODE_BLOCK_CONFIG.dark_theme
    ),
    copyLabel: normalizeText(
      readConfigValue(config, 'copy_label', 'copyLabel', fallback),
      DEFAULT_CODE_BLOCK_CONFIG.copy_label
    ),
    copiedLabel: normalizeText(
      readConfigValue(config, 'copied_label', 'copiedLabel', fallback),
      DEFAULT_CODE_BLOCK_CONFIG.copied_label
    ),
    wrapLongLines: normalizeBoolean(
      readConfigValue(config, 'wrap_long_lines', 'wrapLongLines', fallback),
      DEFAULT_CODE_BLOCK_CONFIG.wrap_long_lines
    ),
    maxHeight: normalizeCssSize(
      readConfigValue(config, 'max_height', 'maxHeight', fallback)
    ),
    collapsible: normalizeBoolean(
      readConfigValue(config, 'collapsible', 'collapsible', fallback),
      DEFAULT_CODE_BLOCK_CONFIG.collapsible
    ),
    collapseThresholdLines,
    previewLines: normalizePositiveInteger(
      config.preview_lines ?? config.previewLines ?? fallbackPreviewLines,
      fallbackPreviewLines
    ),
    expandLabel: normalizeText(
      readConfigValue(config, 'expand_label', 'expandLabel', fallback),
      DEFAULT_CODE_BLOCK_CONFIG.expand_label
    ),
    collapseLabel: normalizeText(
      readConfigValue(config, 'collapse_label', 'collapseLabel', fallback),
      DEFAULT_CODE_BLOCK_CONFIG.collapse_label
    ),
    markDiffLines: normalizeBoolean(
      readConfigValue(config, 'mark_diff_lines', 'markDiffLines', fallback),
      DEFAULT_CODE_BLOCK_CONFIG.mark_diff_lines
    )
  }
}

function normalizeLanguageKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/^language-/, '')
    .replace(/[^a-z0-9#+.-]/g, '')
}

function resolveLanguageAlias(value) {
  const normalizedLanguage = normalizeLanguageKey(value)
  return LANGUAGE_ALIASES[normalizedLanguage] || normalizedLanguage
}

function normalizeCodeBlockLanguageConfig(languageConfig = {}, baseConfig = {}) {
  if (!isPlainObject(languageConfig)) {
    return null
  }

  return normalizeCodeBlockSettings(languageConfig, baseConfig)
}

function normalizeCodeBlockLanguages(languages = {}, baseConfig = {}) {
  if (!isPlainObject(languages)) {
    return {}
  }

  return Object.entries(languages).reduce((result, [language, languageConfig]) => {
    const languageKey = normalizeLanguageKey(language)
    const aliasKey = resolveLanguageAlias(languageKey)
    const normalizedLanguageConfig = normalizeCodeBlockLanguageConfig(languageConfig, baseConfig)

    if (!languageKey || !normalizedLanguageConfig) {
      return result
    }

    result[languageKey] = normalizedLanguageConfig

    if (aliasKey && !result[aliasKey]) {
      result[aliasKey] = normalizedLanguageConfig
    }

    return result
  }, {})
}

export function normalizeCodeBlockConfig(config = {}) {
  const source = isPlainObject(config) ? config : {}
  const baseConfig = normalizeCodeBlockSettings(source, DEFAULT_CODE_BLOCK_CONFIG)

  return {
    ...baseConfig,
    languages: normalizeCodeBlockLanguages(source.languages, baseConfig)
  }
}

export function resolveCodeBlockLanguageConfig(config = {}, language = '') {
  const normalizedConfig = isNormalizedCodeBlockConfig(config)
    ? config
    : normalizeCodeBlockConfig(config)
  const languageKey = normalizeLanguageKey(language)
  const aliasKey = resolveLanguageAlias(languageKey)

  return normalizedConfig.languages?.[languageKey]
    || normalizedConfig.languages?.[aliasKey]
    || normalizedConfig
}

export function formatCodeBlockLanguageLabel(language = '') {
  const normalizedLanguage = normalizeText(language).toLowerCase()

  if (!normalizedLanguage) {
    return ''
  }

  if (LANGUAGE_LABELS[normalizedLanguage]) {
    return LANGUAGE_LABELS[normalizedLanguage]
  }

  return normalizedLanguage.length <= 4
    ? normalizedLanguage.toUpperCase()
    : normalizedLanguage.charAt(0).toUpperCase() + normalizedLanguage.slice(1)
}
