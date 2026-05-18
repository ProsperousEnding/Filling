import { BUILT_IN_PAGE_DEFAULT_COMPONENTS, resolveBuiltInPageComponentKey } from './pageComponentConfig.js'

export const SWITCHABLE_PAGE_LAYOUT_KEYS = Object.freeze(['list', 'card', 'grid', 'timeline'])
const SWITCHABLE_PAGE_LAYOUT_SET = new Set(SWITCHABLE_PAGE_LAYOUT_KEYS)
const BUILT_IN_LAYOUT_PAGE_KEYS = Object.freeze(Object.keys(BUILT_IN_PAGE_DEFAULT_COMPONENTS))

const DEFAULT_BUILT_IN_PAGE_LAYOUTS = Object.freeze({
  home: Object.freeze({
    availableLayouts: ['list', 'card', 'grid'],
    columns: 2,
    wideColumns: 3
  }),
  articles: Object.freeze({
    availableLayouts: ['card', 'list', 'grid'],
    columns: 2,
    wideColumns: 2
  }),
  categories: Object.freeze({
    availableLayouts: ['grid', 'card', 'list'],
    columns: 2,
    wideColumns: 3
  }),
  tags: Object.freeze({
    availableLayouts: ['list', 'grid', 'card'],
    columns: 2,
    wideColumns: 3
  }),
  archive: Object.freeze({
    availableLayouts: ['timeline', 'grid', 'list'],
    columns: 2,
    wideColumns: 3
  })
})

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function normalizeString(value) {
  return String(value || '').trim().toLowerCase()
}

function resolveBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizePositiveInteger(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return Math.min(parsed, 4)
}

function normalizeLayoutArray(values = [], fallback = []) {
  const sourceValues = Array.isArray(values) ? values : fallback
  const uniqueLayouts = []

  sourceValues.forEach((value) => {
    const normalizedLayout = normalizeString(value)

    if (!SWITCHABLE_PAGE_LAYOUT_SET.has(normalizedLayout) || uniqueLayouts.includes(normalizedLayout)) {
      return
    }

    uniqueLayouts.push(normalizedLayout)
  })

  return uniqueLayouts
}

function normalizeLayoutPageEntry(pageKey, pageEntry = {}, rootConfig = {}) {
  const normalizedPageKey = normalizeString(pageKey)
  const defaults = DEFAULT_BUILT_IN_PAGE_LAYOUTS[normalizedPageKey] || DEFAULT_BUILT_IN_PAGE_LAYOUTS.articles
  const normalizedPageEntry = isPlainObject(pageEntry) ? pageEntry : {}
  const requestedDefaultLayout = normalizeString(
    normalizedPageEntry.default
    || normalizedPageEntry.default_layout
    || normalizedPageEntry.defaultLayout
    || normalizedPageEntry.component
  )
  const explicitDefault = SWITCHABLE_PAGE_LAYOUT_SET.has(requestedDefaultLayout)
  const baseDefaultLayout = explicitDefault
    ? requestedDefaultLayout
    : BUILT_IN_PAGE_DEFAULT_COMPONENTS[normalizedPageKey] || 'list'
  const availableLayouts = normalizeLayoutArray(
    normalizedPageEntry.available
    || normalizedPageEntry.available_layouts
    || normalizedPageEntry.availableLayouts
    || normalizedPageEntry.options
    || normalizedPageEntry.layouts,
    defaults.availableLayouts
  )

  if (!availableLayouts.includes(baseDefaultLayout)) {
    availableLayouts.unshift(baseDefaultLayout)
  }

  return {
    defaultLayout: baseDefaultLayout,
    explicitDefault,
    availableLayouts,
    allowSwitch: resolveBoolean(
      normalizedPageEntry.allow_switch ?? normalizedPageEntry.allowSwitch,
      resolveBoolean(rootConfig.allow_switch ?? rootConfig.allowSwitch, false)
    ),
    persist: resolveBoolean(
      normalizedPageEntry.persist,
      resolveBoolean(rootConfig.persist, true)
    ),
    columns: normalizePositiveInteger(
      normalizedPageEntry.columns
      ?? normalizedPageEntry.grid_columns
      ?? normalizedPageEntry.gridColumns,
      defaults.columns
    ),
    wideColumns: normalizePositiveInteger(
      normalizedPageEntry.wide_columns
      ?? normalizedPageEntry.wideColumns
      ?? normalizedPageEntry.desktop_columns
      ?? normalizedPageEntry.desktopColumns,
      Math.max(defaults.wideColumns, defaults.columns)
    )
  }
}

export function normalizeBuiltInPageLayoutsConfig(config = {}) {
  const normalizedConfig = isPlainObject(config) ? config : {}
  const pages = BUILT_IN_LAYOUT_PAGE_KEYS.reduce((result, pageKey) => {
    result[pageKey] = normalizeLayoutPageEntry(pageKey, normalizedConfig[pageKey], normalizedConfig)
    return result
  }, {})

  return {
    allowSwitch: resolveBoolean(normalizedConfig.allow_switch ?? normalizedConfig.allowSwitch, false),
    persist: resolveBoolean(normalizedConfig.persist, true),
    pages
  }
}

export function resolveBuiltInPageLayout(pageKey, requestedComponent, pageLayoutsConfig = {}) {
  const normalizedPageKey = normalizeString(pageKey)
  const normalizedConfig = pageLayoutsConfig?.pages
    ? pageLayoutsConfig
    : normalizeBuiltInPageLayoutsConfig(pageLayoutsConfig)
  const pageEntry = normalizedConfig.pages?.[normalizedPageKey]
    || normalizeLayoutPageEntry(normalizedPageKey, {}, normalizedConfig)
  const requestedLayoutKey = resolveBuiltInPageComponentKey(
    normalizedPageKey,
    requestedComponent || pageEntry.defaultLayout
  )
  const fallbackRequestedLayout = SWITCHABLE_PAGE_LAYOUT_SET.has(requestedLayoutKey)
    ? requestedLayoutKey
    : pageEntry.defaultLayout
  const defaultLayout = pageEntry.explicitDefault ? pageEntry.defaultLayout : fallbackRequestedLayout
  const availableLayouts = pageEntry.availableLayouts.includes(defaultLayout)
    ? pageEntry.availableLayouts.slice()
    : [defaultLayout, ...pageEntry.availableLayouts]

  return {
    pageKey: normalizedPageKey,
    defaultLayout,
    availableLayouts,
    allowSwitch: pageEntry.allowSwitch === true && availableLayouts.length > 1,
    persist: pageEntry.persist !== false,
    columns: pageEntry.columns,
    wideColumns: Math.max(pageEntry.columns, pageEntry.wideColumns)
  }
}
