import {
  DEFAULT_MENU_CONFIG,
  MENU_GROUPS,
  MENU_SOURCE_ALIASES
} from './menuDefaults.js'
import {
  isExternalMenuTarget,
  isValidMenuPageKey,
  normalizeMenuContentPath,
  normalizeMenuPageKey,
  normalizeMenuPagePath
} from './menuRouteConfig.js'
import { isMenuPageComponentKey } from './pageComponentConfig.js'

export function isPlainObject(value) {
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

export function toCamelCase(value) {
  return transformKeysDeep(value, toCamelKey)
}

export function normalizeString(value) {
  return String(value || '').trim()
}

export function normalizePositiveInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function normalizeMenuGroup(value, fallback = '') {
  const normalizedValue = normalizeString(value).toLowerCase()
  return MENU_GROUPS.has(normalizedValue) ? normalizedValue : fallback
}

function normalizeStringList(values = []) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map(value => normalizeString(value))
    .filter(Boolean)
}

export function normalizeMenuSource(source, fallback = 'custom') {
  const normalizedSource = normalizeString(source)

  if (!normalizedSource) {
    return fallback
  }

  return MENU_SOURCE_ALIASES[normalizedSource] || normalizedSource.toLowerCase()
}

function normalizeMenuItems(items = []) {
  return Array.isArray(items) ? items.slice() : []
}

export function normalizeMenuItemChildren(children = []) {
  return Array.isArray(children) ? children.slice() : []
}

function normalizeMenuEntries(entries, fallbackEntries = [], collectionKey = 'menu') {
  if (entries === undefined) {
    return fallbackEntries.map(entry => ({ ...entry, items: normalizeMenuItems(entry.items) }))
  }

  if (!Array.isArray(entries)) {
    return []
  }

  return entries
    .filter(entry => isPlainObject(entry))
    .map((entry, index) => {
      const normalizedEntry = toCamelCase(entry)
      const normalizedEntryKey = normalizeString(normalizedEntry.key)
      const normalizedEntrySource = normalizeMenuSource(normalizedEntry.source, '')
      const fallbackEntry = fallbackEntries.find(candidate => (
        normalizedEntryKey && normalizeString(candidate.key) === normalizedEntryKey
      )) || fallbackEntries.find(candidate => (
        normalizedEntrySource
        && normalizeMenuSource(candidate.source, '') === normalizedEntrySource
      )) || fallbackEntries[index] || {}
      const source = normalizeMenuSource(
        normalizedEntry.source,
        normalizeMenuSource(fallbackEntry.source, 'custom')
      )
      const limit = normalizePositiveInteger(
        normalizedEntry.limit,
        normalizePositiveInteger(fallbackEntry.limit, 0)
      )

      return {
        key: normalizedEntryKey || `${collectionKey}-${index + 1}`,
        title: normalizeString(normalizedEntry.title || fallbackEntry.title),
        renderer: normalizeString(normalizedEntry.renderer || fallbackEntry.renderer),
        source,
        variant: normalizeString(normalizedEntry.variant || fallbackEntry.variant || 'default') || 'default',
        showCount: typeof normalizedEntry.showCount === 'boolean'
          ? normalizedEntry.showCount
          : Boolean(fallbackEntry.showCount),
        limit,
        primaryLimit: normalizePositiveInteger(
          normalizedEntry.primaryLimit,
          normalizePositiveInteger(fallbackEntry.primaryLimit, 0)
        ),
        overflowLabel: normalizeString(normalizedEntry.overflowLabel || fallbackEntry.overflowLabel),
        enabled: typeof normalizedEntry.enabled === 'boolean'
          ? normalizedEntry.enabled
          : fallbackEntry.enabled !== false,
        items: normalizeMenuItems(normalizedEntry.items || fallbackEntry.items)
      }
    })
    .filter(entry => entry.enabled && entry.renderer)
}

export function normalizeMenuPageComponent(value, fallback = '') {
  const normalizedValue = normalizeString(value)

  if (!normalizedValue) {
    return fallback
  }

  const normalizedComponent = normalizedValue.toLowerCase()
  return isMenuPageComponentKey(normalizedComponent) ? normalizedComponent : fallback
}

function createMenuPageItem(entry = {}, fallbackKey = '') {
  if (!isPlainObject(entry)) {
    return null
  }

  const target = normalizeString(entry.target || entry.to || entry.path || entry.href)
  const title = normalizeString(entry.title || entry.label || entry.name)
  const description = normalizeString(entry.description || entry.content || entry.body)
  const meta = normalizeString(entry.meta || entry.eyebrow || entry.note)
  const key = normalizeString(entry.key || entry.id || fallbackKey)

  if (!title && !description) {
    return null
  }

  return {
    key: key || `page-item-${title || description}`,
    title: title || description,
    description: title && description ? description : '',
    meta,
    target,
    to: target && !isExternalMenuTarget(target) ? target : '',
    href: target && isExternalMenuTarget(target) ? target : '',
    external: Boolean(target && isExternalMenuTarget(target))
  }
}

function parseMenuPageItemString(value, index) {
  const normalizedValue = normalizeString(value)

  if (!normalizedValue) {
    return null
  }

  const [rawTitle = '', rawDescription = '', rawTarget = '', rawMeta = ''] = normalizedValue.split('|')

  return createMenuPageItem({
    key: `page-item-${index + 1}`,
    title: rawTitle,
    description: rawDescription,
    target: rawTarget,
    meta: rawMeta
  }, `page-item-${index + 1}`)
}

function normalizeMenuPageItems(items = []) {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map((item, index) => {
      if (typeof item === 'string') {
        return parseMenuPageItemString(item, index)
      }

      return createMenuPageItem(item, `page-item-${index + 1}`)
    })
    .filter(Boolean)
}

function normalizeFriendApplicationConfig(application = {}) {
  if (!isPlainObject(application)) {
    return {
      enabled: false,
      title: '',
      description: '',
      requirements: [],
      submissionFields: [],
      template: '',
      contactLabel: '',
      contactUrl: ''
    }
  }

  const normalizedApplication = toCamelCase(application)
  const title = normalizeString(normalizedApplication.title || normalizedApplication.heading)
  const description = normalizeString(
    normalizedApplication.description
    || normalizedApplication.summary
    || normalizedApplication.content
  )
  const requirements = normalizeStringList(
    normalizedApplication.requirements
    || normalizedApplication.rules
    || normalizedApplication.conditions
  )
  const submissionFields = normalizeStringList(
    normalizedApplication.submissionFields
    || normalizedApplication.fields
    || normalizedApplication.items
  )
  const template = normalizeString(
    normalizedApplication.template
    || normalizedApplication.example
    || normalizedApplication.sample
  )
  const contactLabel = normalizeString(
    normalizedApplication.contactLabel
    || normalizedApplication.ctaLabel
    || normalizedApplication.actionText
  )
  const contactUrl = normalizeString(
    normalizedApplication.contactUrl
    || normalizedApplication.contact
    || normalizedApplication.href
    || normalizedApplication.target
  )

  return {
    enabled: Boolean(
      title
      || description
      || requirements.length > 0
      || submissionFields.length > 0
      || template
      || contactLabel
      || contactUrl
    ),
    title,
    description,
    requirements,
    submissionFields,
    template,
    contactLabel,
    contactUrl
  }
}

function normalizeMenuPages(pages = []) {
  if (!Array.isArray(pages)) {
    return []
  }

  return pages
    .filter(entry => isPlainObject(entry))
    .map((entry) => {
      const normalizedEntry = toCamelCase(entry)
      const key = normalizeMenuPageKey(normalizedEntry.key || normalizedEntry.id)

      return {
        key,
        label: normalizeString(normalizedEntry.label || normalizedEntry.name || normalizedEntry.title),
        title: normalizeString(normalizedEntry.title || normalizedEntry.label || normalizedEntry.name),
        path: normalizeMenuPagePath(normalizedEntry.path || normalizedEntry.to || normalizedEntry.href, ''),
        component: normalizeMenuPageComponent(normalizedEntry.component, ''),
        menuGroup: normalizeMenuGroup(normalizedEntry.menuGroup, ''),
        menuOrder: normalizePositiveInteger(normalizedEntry.menuOrder, 0),
        description: normalizeString(normalizedEntry.description || normalizedEntry.summary),
        enabled: typeof normalizedEntry.enabled === 'boolean' ? normalizedEntry.enabled : true,
        visible: typeof normalizedEntry.visible === 'boolean' ? normalizedEntry.visible : true,
        content: normalizeString(normalizedEntry.content || normalizedEntry.body || normalizedEntry.text),
        items: normalizeMenuPageItems(normalizedEntry.items),
        file: normalizeMenuContentPath(normalizedEntry.file || normalizedEntry.sourceFile, 'file'),
        folder: normalizeMenuContentPath(normalizedEntry.folder || normalizedEntry.sourceFolder, 'folder'),
        application: normalizeFriendApplicationConfig(normalizedEntry.application)
      }
    })
    .filter(entry => isValidMenuPageKey(entry.key))
}

export function normalizeMenuConfig(menus = {}) {
  const normalizedMenus = isPlainObject(menus) ? toCamelCase(menus) : {}

  return {
    header: normalizeMenuEntries(normalizedMenus.header, DEFAULT_MENU_CONFIG.header, 'header'),
    mobileHeader: normalizeMenuEntries(
      normalizedMenus.mobileHeader,
      DEFAULT_MENU_CONFIG.mobileHeader,
      'mobile-header'
    ),
    sidebar: normalizeMenuEntries(normalizedMenus.sidebar, DEFAULT_MENU_CONFIG.sidebar, 'sidebar'),
    pages: normalizeMenuPages(normalizedMenus.pages)
  }
}
