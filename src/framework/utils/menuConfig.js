import {
  getArticlePath,
  getCategoryPath,
  getTagPath
} from './routeLinks.js'
import {
  BUILT_IN_PAGE_DEFAULT_COMPONENTS,
  isMenuPageComponentKey
} from './pageComponentConfig.js'

const DEFAULT_MENU_CONFIG = Object.freeze({
  header: Object.freeze([
    Object.freeze({
      key: 'primary',
      renderer: 'header-pill',
      source: 'blog-nav',
      items: []
    })
  ]),
  mobileHeader: Object.freeze([
    Object.freeze({
      key: 'primary-mobile',
      renderer: 'header-stack',
      source: 'blog-nav',
      items: []
    })
  ]),
  sidebar: Object.freeze([
    Object.freeze({
      key: 'categories',
      title: '分类',
      renderer: 'sidebar-link',
      source: 'categories',
      variant: 'default',
      showCount: true,
      limit: 0,
      items: []
    }),
    Object.freeze({
      key: 'tags',
      title: '标签',
      renderer: 'sidebar-link',
      source: 'tags',
      variant: 'tags',
      showCount: true,
      limit: 0,
      items: []
    }),
    Object.freeze({
      key: 'latest-articles',
      title: '最新文章',
      renderer: 'sidebar-article',
      source: 'latest-articles',
      variant: 'default',
      showCount: false,
      limit: 5,
      items: []
    })
  ]),
  pages: Object.freeze([])
})

const DEFAULT_MENU_PAGES = Object.freeze([
  Object.freeze({
    key: 'home',
    label: '首页',
    title: '最新文章',
    description: '浏览站点最新发布的文章内容。',
    component: BUILT_IN_PAGE_DEFAULT_COMPONENTS.home
  }),
  Object.freeze({
    key: 'articles',
    label: '文章',
    title: '所有文章',
    description: '浏览站点全部文章列表。',
    component: BUILT_IN_PAGE_DEFAULT_COMPONENTS.articles
  }),
  Object.freeze({
    key: 'categories',
    label: '分类',
    title: '文章分类',
    description: '浏览站点所有文章分类。',
    component: BUILT_IN_PAGE_DEFAULT_COMPONENTS.categories
  }),
  Object.freeze({
    key: 'tags',
    label: '标签',
    title: '文章标签',
    description: '浏览站点所有文章标签。',
    component: BUILT_IN_PAGE_DEFAULT_COMPONENTS.tags
  }),
  Object.freeze({
    key: 'archive',
    label: '归档',
    title: '文章归档',
    description: '按年份浏览站点归档文章。',
    component: BUILT_IN_PAGE_DEFAULT_COMPONENTS.archive
  })
])

const BUILT_IN_MENU_PAGE_KEYS = new Set(DEFAULT_MENU_PAGES.map(page => page.key))

const SOURCE_ALIASES = Object.freeze({
  blogNav: 'blog-nav',
  blog_nav: 'blog-nav',
  categories: 'categories',
  tags: 'tags',
  latestArticles: 'latest-articles',
  latest_articles: 'latest-articles',
  friendLinks: 'friend-links',
  friend_links: 'friend-links',
  custom: 'custom'
})

const menuSourceRegistry = new Map()

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

function normalizeString(value) {
  return String(value || '').trim()
}

function normalizePageKey(value) {
  return normalizeString(value).toLowerCase()
}

function normalizePositiveInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeStringList(values = []) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map(value => normalizeString(value))
    .filter(Boolean)
}

function normalizeMenuSource(source, fallback = 'custom') {
  const normalizedSource = normalizeString(source)

  if (!normalizedSource) {
    return fallback
  }

  return SOURCE_ALIASES[normalizedSource] || normalizedSource.toLowerCase()
}

function normalizeMenuItems(items = []) {
  return Array.isArray(items) ? items.slice() : []
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
      const fallbackEntry = fallbackEntries[index] || {}
      const source = normalizeMenuSource(normalizedEntry.source, normalizeMenuSource(fallbackEntry.source, 'custom'))
      const limit = normalizePositiveInteger(
        normalizedEntry.limit,
        normalizePositiveInteger(fallbackEntry.limit, 0)
      )

      return {
        key: normalizeString(normalizedEntry.key) || `${collectionKey}-${index + 1}`,
        title: normalizeString(normalizedEntry.title || fallbackEntry.title),
        renderer: normalizeString(normalizedEntry.renderer || fallbackEntry.renderer),
        source,
        variant: normalizeString(normalizedEntry.variant || fallbackEntry.variant || 'default') || 'default',
        showCount: typeof normalizedEntry.showCount === 'boolean'
          ? normalizedEntry.showCount
          : Boolean(fallbackEntry.showCount),
        limit,
        enabled: typeof normalizedEntry.enabled === 'boolean'
          ? normalizedEntry.enabled
          : fallbackEntry.enabled !== false,
        items: normalizeMenuItems(normalizedEntry.items || fallbackEntry.items)
      }
    })
    .filter(entry => entry.enabled && entry.renderer)
}

function isExternalTarget(target) {
  return /^(https?:)?\/\//i.test(target) || target.startsWith('mailto:') || target.startsWith('tel:')
}

function normalizeMenuPageComponent(value, fallback = '') {
  const normalizedValue = normalizeString(value)

  if (!normalizedValue) {
    return fallback
  }

  const normalizedComponent = normalizedValue.toLowerCase()
  return isMenuPageComponentKey(normalizedComponent) ? normalizedComponent : fallback
}

function normalizeMenuPagePath(value, fallback = '') {
  const normalizedValue = normalizeString(value)
  const target = normalizedValue || normalizeString(fallback)

  if (!target || isExternalTarget(target) || target.includes(':')) {
    return ''
  }

  const withLeadingSlash = target.startsWith('/') ? target : `/${target}`
  return withLeadingSlash === '/' ? withLeadingSlash : withLeadingSlash.replace(/\/+$/, '')
}

function normalizeMenuContentPath(value, kind = 'file') {
  const normalizedValue = normalizeString(value)
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^\/+/, '')
  const segments = normalizedValue
    .split('/')
    .map(segment => segment.trim())
    .filter(segment => segment && segment !== '.')

  if (segments.length === 0 || segments.some(segment => segment === '..')) {
    return ''
  }

  const resolvedPath = segments.join('/')

  return kind === 'folder'
    ? resolvedPath.replace(/\/+$/, '')
    : resolvedPath
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
    to: target && !isExternalTarget(target) ? target : '',
    href: target && isExternalTarget(target) ? target : '',
    external: Boolean(target && isExternalTarget(target))
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
    .map((entry, index) => {
      const normalizedEntry = toCamelCase(entry)
      const key = normalizePageKey(normalizedEntry.key || normalizedEntry.id || `page-${index + 1}`)

      return {
        key,
        label: normalizeString(normalizedEntry.label || normalizedEntry.name || normalizedEntry.title),
        title: normalizeString(normalizedEntry.title || normalizedEntry.label || normalizedEntry.name),
        path: normalizeMenuPagePath(normalizedEntry.path || normalizedEntry.to || normalizedEntry.href, ''),
        component: normalizeMenuPageComponent(normalizedEntry.component, ''),
        description: normalizeString(normalizedEntry.description || normalizedEntry.summary),
        content: normalizeString(normalizedEntry.content || normalizedEntry.body || normalizedEntry.text),
        items: normalizeMenuPageItems(normalizedEntry.items),
        file: normalizeMenuContentPath(normalizedEntry.file || normalizedEntry.sourceFile, 'file'),
        folder: normalizeMenuContentPath(normalizedEntry.folder || normalizedEntry.sourceFolder, 'folder'),
        application: normalizeFriendApplicationConfig(normalizedEntry.application)
      }
    })
    .filter(entry => entry.key)
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

function resolveBuiltInMenuPagePath(key, routePatterns = {}) {
  switch (key) {
    case 'home':
      return normalizeMenuPagePath(routePatterns.home, '/')
    case 'articles':
      return normalizeMenuPagePath(routePatterns.articles, '/articles')
    case 'categories':
      return normalizeMenuPagePath(routePatterns.categories, '/category')
    case 'tags':
      return normalizeMenuPagePath(routePatterns.tags, '/tag')
    case 'archive':
      return normalizeMenuPagePath(routePatterns.archive, '/archive')
    default:
      return ''
  }
}

function createDefaultMenuPage(definition, routePatterns = {}) {
  return {
    ...definition,
    path: resolveBuiltInMenuPagePath(definition.key, routePatterns),
    content: '',
    items: [],
    file: '',
    folder: '',
    builtIn: true
  }
}

export function getDefaultMenuPages(routePatterns = {}) {
  return DEFAULT_MENU_PAGES
    .map(page => createDefaultMenuPage(page, routePatterns))
    .filter(page => page.path)
}

export function resolveMenuPages(menuConfig = {}, routePatterns = {}) {
  const normalizedMenuConfig = normalizeMenuConfig(menuConfig)
  const defaultPages = getDefaultMenuPages(routePatterns)
  const resolvedPages = []
  const resolvedKeys = new Set()
  const reservedPaths = new Set(
    Object.values(routePatterns || {})
      .map(value => normalizeMenuPagePath(value, ''))
      .filter(Boolean)
  )

  defaultPages.forEach((defaultPage) => {
    const override = normalizedMenuConfig.pages.find(page => page.key === defaultPage.key) || null

    resolvedPages.push({
      ...defaultPage,
      label: normalizeString(override?.label || defaultPage.label) || defaultPage.label,
      title: normalizeString(override?.title || defaultPage.title) || defaultPage.title,
      component: normalizeMenuPageComponent(override?.component, defaultPage.component),
      description: normalizeString(override?.description || defaultPage.description)
    })
    resolvedKeys.add(defaultPage.key)
  })

  const usedPaths = new Set(resolvedPages.map(page => page.path))

  normalizedMenuConfig.pages.forEach((page) => {
    if (resolvedKeys.has(page.key)) {
      return
    }

    const path = normalizeMenuPagePath(page.path, `/${page.key}`)
    const label = normalizeString(page.label || page.title || page.key)
    const title = normalizeString(page.title || page.label || page.key)

    if (!page.key || !path || !label || !title) {
      return
    }

    if (reservedPaths.has(path) || usedPaths.has(path)) {
      return
    }

    resolvedPages.push({
      key: page.key,
      label,
      title,
      path,
      component: normalizeMenuPageComponent(page.component, 'context'),
      description: normalizeString(page.description),
      content: normalizeString(page.content),
      items: Array.isArray(page.items) ? page.items.map(item => ({ ...item })) : [],
      file: normalizeMenuContentPath(page.file, 'file'),
      folder: normalizeMenuContentPath(page.folder, 'folder'),
      builtIn: false
    })
    resolvedKeys.add(page.key)
    usedPaths.add(path)
  })

  return resolvedPages
}

export function resolveMenuPage(pageOrKey, menuConfig = {}, routePatterns = {}) {
  const pages = resolveMenuPages(menuConfig, routePatterns)
  const key = normalizePageKey(
    typeof pageOrKey === 'object' && pageOrKey !== null
      ? pageOrKey.key || pageOrKey.path
      : pageOrKey
  )
  const path = normalizeMenuPagePath(
    typeof pageOrKey === 'object' && pageOrKey !== null
      ? pageOrKey.path
      : pageOrKey,
    ''
  )

  if (!key && !path) {
    return null
  }

  return pages.find(page => page.key === key || page.path === path) || null
}

export function getCustomMenuPages(menuConfig = {}, routePatterns = {}) {
  return resolveMenuPages(menuConfig, routePatterns)
    .filter(page => !page.builtIn)
}

export function getMenuPagePath(pageOrKey, menuConfig = {}, routePatterns = {}) {
  return resolveMenuPage(pageOrKey, menuConfig, routePatterns)?.path || '/'
}

function createResolvedMenuItem({
  key,
  label,
  target,
  matchPath = '',
  badge = '',
  meta = ''
}) {
  const normalizedLabel = normalizeString(label)
  const normalizedTarget = normalizeString(target)

  if (!normalizedLabel || !normalizedTarget) {
    return null
  }

  const external = isExternalTarget(normalizedTarget)

  return {
    key: normalizeString(key) || `${normalizedLabel}-${normalizedTarget}`,
    label: normalizedLabel,
    to: external ? undefined : normalizedTarget,
    href: external ? normalizedTarget : undefined,
    external,
    matchPath: external ? '' : (normalizeString(matchPath) || normalizedTarget),
    badge: normalizeString(badge),
    meta: normalizeString(meta)
  }
}

export function createMenuItem(item = {}) {
  if (!isPlainObject(item)) {
    return null
  }

  return createResolvedMenuItem({
    key: item.key,
    label: item.label || item.name || item.title,
    target: item.target || item.to || item.path || item.href,
    matchPath: item.matchPath,
    badge: item.badge,
    meta: item.meta || item.description
  })
}

function parseCustomMenuItem(item, index) {
  if (isPlainObject(item)) {
    return createMenuItem({
      ...item,
      key: item.key || `custom-item-${index + 1}`
    })
  }

  const normalizedValue = normalizeString(item)
  if (!normalizedValue.includes('|')) {
    return null
  }

  const [rawLabel, ...rawTargetParts] = normalizedValue.split('|')
  const rawTarget = rawTargetParts.join('|')

  return createResolvedMenuItem({
    key: `custom-item-${index + 1}`,
    label: rawLabel,
    target: rawTarget
  })
}

function applyLimit(items, limit = 0) {
  return limit > 0 ? items.slice(0, limit) : items
}

function normalizeResolvedMenuItem(item, index) {
  if (typeof item === 'string') {
    return parseCustomMenuItem(item, index)
  }

  if (!isPlainObject(item)) {
    return null
  }

  const target = item.target || item.to || item.path || item.href

  if (!target) {
    return null
  }

  return createMenuItem({
    ...item,
    key: item.key || item.id || item.slug || `menu-item-${index + 1}`
  })
}

function normalizeResolvedMenuItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .map(normalizeResolvedMenuItem)
    .filter(Boolean)
}

function createMenuSourceHelpers(context = {}) {
  return {
    routePatterns: context.routePatterns || {},
    applyLimit,
    createMenuItem,
    normalizeString
  }
}

function resolveBlogNavMenuSource(definition, context = {}) {
  const routePatterns = context.routePatterns || {}
  const sourceItems = Array.isArray(definition.items) ? definition.items : []
  const navItems = resolveMenuPages(context.menuConfig || {}, routePatterns)
  const requestedKeys = sourceItems
    .map(item => normalizePageKey(item))
    .filter(Boolean)
  const filteredNavItems = requestedKeys.length > 0
    ? requestedKeys
      .map(requestedKey => navItems.find(item => item.key === requestedKey))
      .filter(Boolean)
    : navItems

  return filteredNavItems.map(item => createMenuItem({
    key: item.key,
    label: item.label,
    target: item.path,
    matchPath: item.path
  }))
}

function resolveCategoriesMenuSource(definition, context = {}) {
  const routePatterns = context.routePatterns || {}
  const categories = Array.isArray(context.categories) ? context.categories : []
  const shouldShowCount = definition.showCount && context.showCategoryCount !== false

  return applyLimit(categories, definition.limit)
    .map(category => createMenuItem({
      key: category.id,
      label: category.name,
      target: getCategoryPath(category, routePatterns),
      matchPath: getCategoryPath(category, routePatterns),
      badge: shouldShowCount ? String(category.count ?? category.articleCount ?? 0) : ''
    }))
}

function resolveTagsMenuSource(definition, context = {}) {
  const routePatterns = context.routePatterns || {}
  const tags = Array.isArray(context.tags) ? context.tags : []
  const shouldShowCount = definition.showCount && context.showTagCount !== false

  return applyLimit(tags, definition.limit)
    .map(tag => createMenuItem({
      key: tag.id,
      label: tag.name,
      target: getTagPath(tag, routePatterns),
      matchPath: getTagPath(tag, routePatterns),
      badge: shouldShowCount ? `(${tag.count ?? tag.articleCount ?? 0})` : ''
    }))
}

function resolveLatestArticlesMenuSource(definition, context = {}) {
  const routePatterns = context.routePatterns || {}
  const latestArticles = Array.isArray(context.latestArticles) ? context.latestArticles : []

  return applyLimit(latestArticles, definition.limit || 5)
    .map(article => createMenuItem({
      key: article.id,
      label: article.title,
      target: getArticlePath(article, routePatterns),
      matchPath: getArticlePath(article, routePatterns),
      meta: context.formatArticleMeta ? context.formatArticleMeta(article) : ''
    }))
}

function resolveFriendLinksMenuSource(definition, context = {}) {
  const friendLinks = Array.isArray(context.friendLinks) ? context.friendLinks : []

  return applyLimit(friendLinks, definition.limit)
    .map(link => createMenuItem({
      key: link.id || link.name,
      label: link.name,
      target: link.url,
      meta: link.description
    }))
}

function resolveCustomMenuSource(definition) {
  const sourceItems = Array.isArray(definition.items) ? definition.items : []
  return sourceItems.map(parseCustomMenuItem)
}

export function registerMenuSource(name, resolver) {
  const normalizedName = normalizeMenuSource(name, '')

  if (!normalizedName || typeof resolver !== 'function') {
    return false
  }

  menuSourceRegistry.set(normalizedName, resolver)
  return true
}

export function resolveMenuSource(name) {
  const normalizedName = normalizeMenuSource(name, '')
  return normalizedName ? menuSourceRegistry.get(normalizedName) || null : null
}

export function getRegisteredMenuSources() {
  return Array.from(menuSourceRegistry.keys())
}

registerMenuSource('blog-nav', resolveBlogNavMenuSource)
registerMenuSource('categories', resolveCategoriesMenuSource)
registerMenuSource('tags', resolveTagsMenuSource)
registerMenuSource('latest-articles', resolveLatestArticlesMenuSource)
registerMenuSource('friend-links', resolveFriendLinksMenuSource)
registerMenuSource('custom', resolveCustomMenuSource)

function resolveMenuSourceItems(definition, context = {}) {
  const normalizedSource = normalizeMenuSource(definition.source, '')
  const resolver = resolveMenuSource(normalizedSource)

  if (!resolver) {
    return []
  }

  return normalizeResolvedMenuItems(
    resolver(
      {
        ...definition,
        source: normalizedSource
      },
      context,
      createMenuSourceHelpers(context)
    )
  )
}

function resolveHeaderMenuCollection(entries, context = {}) {
  return entries
    .map((entry) => {
      const items = resolveMenuSourceItems(entry, context)

      if (items.length === 0) {
        return null
      }

      return {
        key: entry.key,
        renderer: entry.renderer,
        rendererProps: {
          items,
          activePath: context.activePath || '',
          variant: entry.variant
        }
      }
    })
    .filter(Boolean)
}

function resolveSidebarMenuCollection(entries, context = {}) {
  return entries
    .map((entry) => {
      const items = resolveMenuSourceItems(entry, context)

      if (items.length === 0) {
        return null
      }

      return {
        key: entry.key,
        title: entry.title || '',
        items: items.length,
        renderer: entry.renderer,
        rendererProps: {
          items,
          variant: entry.variant
        }
      }
    })
    .filter(Boolean)
}

export function resolveHeaderMenuGroups(menuConfig = {}, context = {}) {
  const normalizedMenuConfig = normalizeMenuConfig(menuConfig)
  return resolveHeaderMenuCollection(normalizedMenuConfig.header, {
    ...context,
    menuConfig: normalizedMenuConfig
  })
}

export function resolveMobileHeaderMenuGroups(menuConfig = {}, context = {}) {
  const normalizedMenuConfig = normalizeMenuConfig(menuConfig)
  return resolveHeaderMenuCollection(normalizedMenuConfig.mobileHeader, {
    ...context,
    menuConfig: normalizedMenuConfig
  })
}

export function resolveSidebarMenuSections(menuConfig = {}, context = {}) {
  const normalizedMenuConfig = normalizeMenuConfig(menuConfig)
  return resolveSidebarMenuCollection(normalizedMenuConfig.sidebar, {
    ...context,
    menuConfig: normalizedMenuConfig
  })
}

function getMenuEntries(menuConfig = {}, collections = ['sidebar']) {
  const normalizedMenuConfig = normalizeMenuConfig(menuConfig)

  return collections.flatMap((collectionKey) => (
    Array.isArray(normalizedMenuConfig[collectionKey]) ? normalizedMenuConfig[collectionKey] : []
  ))
}

export function menuUsesSource(menuConfig = {}, source, collections = ['sidebar']) {
  const normalizedSource = normalizeMenuSource(source, '')

  return getMenuEntries(menuConfig, collections)
    .some(entry => entry.source === normalizedSource)
}

export function getMaxMenuSourceLimit(menuConfig = {}, source, collections = ['sidebar'], fallback = 0) {
  const normalizedSource = normalizeMenuSource(source, '')
  const matchingEntries = getMenuEntries(menuConfig, collections)
    .filter(entry => entry.source === normalizedSource)

  if (matchingEntries.length === 0) {
    return fallback
  }

  return matchingEntries.reduce((maxLimit, entry) => {
    const entryLimit = normalizePositiveInteger(entry.limit, 0)
    return Math.max(maxLimit, entryLimit)
  }, 0) || fallback
}

export function getDefaultMenuConfig() {
  return normalizeMenuConfig()
}

export {
  BUILT_IN_MENU_PAGE_KEYS,
  DEFAULT_MENU_CONFIG
}
