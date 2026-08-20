import { DEFAULT_MENU_PAGES } from '../../framework/utils/menuDefaults.js'

const BUILT_IN_PATHS = Object.freeze({
  home: '/',
  articles: '/articles',
  categories: '/category',
  tags: '/tag',
  archive: '/archive',
  search: '/search'
})

const EDITABLE_PAGE_KEYS = new Set([
  'key',
  'label',
  'title',
  'description',
  'component',
  'file',
  'folder',
  'path',
  'visible',
  'enabled',
  'menu_group',
  'menu_order',
  'menuGroup',
  'menuOrder'
])

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]))
  }
  return value
}

function normalizeString(value) {
  return String(value || '').trim()
}

function getConfiguredValue(configured, snakeKey, camelKey, fallback) {
  if (Object.prototype.hasOwnProperty.call(configured, snakeKey)) return configured[snakeKey]
  if (camelKey && Object.prototype.hasOwnProperty.call(configured, camelKey)) return configured[camelKey]
  return fallback
}

function createBuiltInRow(definition, configured = {}) {
  return {
    key: definition.key,
    label: getConfiguredValue(configured, 'label', '', definition.label),
    title: getConfiguredValue(configured, 'title', '', definition.title),
    description: getConfiguredValue(configured, 'description', '', definition.description),
    component: getConfiguredValue(configured, 'component', '', definition.component),
    file: '',
    folder: '',
    path: BUILT_IN_PATHS[definition.key] || '',
    visible: getConfiguredValue(configured, 'visible', '', definition.visible !== false),
    enabled: getConfiguredValue(configured, 'enabled', '', true),
    menu_group: getConfiguredValue(configured, 'menu_group', 'menuGroup', definition.menuGroup),
    menu_order: getConfiguredValue(configured, 'menu_order', 'menuOrder', definition.menuOrder),
    builtIn: true,
    _configured: cloneValue(configured),
    _default: definition,
    _defaultMenuOrder: definition.menuOrder
  }
}

function createCustomRow(configured = {}, index = 0) {
  const defaultMenuOrder = 1000 + index
  return {
    key: normalizeString(configured.key),
    label: normalizeString(configured.label),
    title: normalizeString(configured.title),
    description: normalizeString(configured.description),
    component: normalizeString(configured.component) || 'context',
    file: normalizeString(configured.file),
    folder: normalizeString(configured.folder),
    path: normalizeString(configured.path),
    visible: typeof configured.visible === 'boolean' ? configured.visible : true,
    enabled: typeof configured.enabled === 'boolean' ? configured.enabled : true,
    menu_group: normalizeString(configured.menu_group || configured.menuGroup) || 'more',
    menu_order: Number(configured.menu_order || configured.menuOrder) || defaultMenuOrder,
    builtIn: false,
    _configured: cloneValue(configured),
    _defaultMenuOrder: defaultMenuOrder
  }
}

function compareRows(left, right) {
  return Number(left.menu_order) - Number(right.menu_order)
}

export function createAdminMenuRows(configuredPages = []) {
  const pages = Array.isArray(configuredPages) ? configuredPages : []
  const builtInKeys = new Set(DEFAULT_MENU_PAGES.map(page => page.key))
  const configuredByKey = new Map(pages.map(page => [page?.key, page]))
  const builtInRows = DEFAULT_MENU_PAGES.map(page => (
    createBuiltInRow(page, configuredByKey.get(page.key) || {})
  ))
  const customRows = pages
    .filter(page => page && !builtInKeys.has(page.key))
    .map(createCustomRow)

  return [...builtInRows, ...customRows].sort(compareRows)
}

function preserveUnmanagedValues(configured = {}) {
  return Object.fromEntries(
    Object.entries(configured)
      .filter(([key]) => !EDITABLE_PAGE_KEYS.has(key))
      .map(([key, value]) => [key, cloneValue(value)])
  )
}

function serializeBuiltInRow(row) {
  const defaults = row._default
  const result = preserveUnmanagedValues(row._configured)

  if (normalizeString(row.label) !== defaults.label) result.label = normalizeString(row.label)
  if (normalizeString(row.title) !== defaults.title) result.title = normalizeString(row.title)
  if (normalizeString(row.description) !== defaults.description) {
    result.description = normalizeString(row.description)
  }
  if (normalizeString(row.component) !== defaults.component) {
    result.component = normalizeString(row.component)
  }
  if (row.visible !== (defaults.visible !== false)) result.visible = Boolean(row.visible)
  if (row.enabled !== true) result.enabled = Boolean(row.enabled)
  if (normalizeString(row.menu_group) !== defaults.menuGroup) {
    result.menu_group = normalizeString(row.menu_group)
  }
  if (Number(row.menu_order) !== defaults.menuOrder) result.menu_order = Number(row.menu_order)

  return Object.keys(result).length > 0 ? { key: row.key, ...result } : null
}

function serializeCustomRow(row) {
  const result = {
    ...preserveUnmanagedValues(row._configured),
    key: normalizeString(row.key),
    title: normalizeString(row.title),
    component: normalizeString(row.component) || 'context'
  }

  if (normalizeString(row.label)) result.label = normalizeString(row.label)
  if (normalizeString(row.description)) result.description = normalizeString(row.description)
  if (normalizeString(row.file)) result.file = normalizeString(row.file)
  if (normalizeString(row.folder)) result.folder = normalizeString(row.folder)
  if (normalizeString(row.path)) result.path = normalizeString(row.path)
  if (row.visible === false) result.visible = false
  if (row.enabled === false) result.enabled = false
  if (normalizeString(row.menu_group) !== 'more') {
    result.menu_group = normalizeString(row.menu_group)
  }
  if (Number(row.menu_order) !== row._defaultMenuOrder) {
    result.menu_order = Number(row.menu_order)
  }

  return result
}

export function serializeAdminMenuRows(rows = []) {
  return rows
    .map(row => row.builtIn ? serializeBuiltInRow(row) : serializeCustomRow(row))
    .filter(Boolean)
}

export function createAdminMenuPage(rows = []) {
  const highestOrder = rows.reduce((highest, row) => (
    Math.max(highest, Number(row.menu_order) || 0)
  ), 990)

  return createCustomRow({
    component: 'context',
    menu_group: 'more',
    menu_order: highestOrder + 10
  }, rows.filter(row => !row.builtIn).length)
}

export function moveAdminMenuRow(rows = [], index, direction) {
  const targetIndex = index + direction
  if (index < 0 || targetIndex < 0 || index >= rows.length || targetIndex >= rows.length) {
    return rows.map(row => ({ ...row }))
  }

  const nextRows = rows.map(row => ({ ...row }))
  const currentOrder = nextRows[index].menu_order
  nextRows[index].menu_order = nextRows[targetIndex].menu_order
  nextRows[targetIndex].menu_order = currentOrder
  nextRows.sort(compareRows)
  return nextRows
}

export function getAdminMenuPreview(rows = [], primaryLimit = 5) {
  const visibleRows = rows
    .filter(row => row.enabled !== false && row.visible !== false)
    .slice()
    .sort(compareRows)
  const primary = visibleRows.filter(row => row.menu_group !== 'more')
  const overflowRows = new Set(visibleRows.filter(row => row.menu_group === 'more'))

  while (primary.length > primaryLimit) {
    const overflowIndex = primary.findLastIndex(row => row.menu_group !== 'primary')
    if (overflowIndex < 0) break
    overflowRows.add(primary[overflowIndex])
    primary.splice(overflowIndex, 1)
  }

  return {
    primary,
    overflow: visibleRows.filter(row => overflowRows.has(row))
  }
}
