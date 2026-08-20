import {
  getArticlePath,
  getCategoryPath,
  getTagPath,
  normalizeBlogRoutePatterns
} from './routeLinks.js'
import {
  findOverlappingRoute,
  getCustomMenuPageRoutePatterns,
  getDynamicBlogRoutePatterns,
  isExternalMenuTarget as isExternalTarget,
  isValidMenuPageKey,
  MENU_COLLECTION_PAGE_COMPONENTS,
  normalizeMenuLinkTarget,
  normalizeMenuPageKey as normalizePageKey,
  normalizeMenuPagePath
} from './menuRouteConfig.js'
import { isMenuPageComponentKey } from './pageComponentConfig.js'
import {
  BUILT_IN_MENU_PAGE_KEYS,
  DEFAULT_MENU_CONFIG,
  DEFAULT_MENU_RENDERER_NAMES,
  MENU_GROUPS
} from './menuDefaults.js'
import {
  isPlainObject,
  normalizeMenuConfig,
  normalizeMenuGroup,
  normalizeMenuItemChildren,
  normalizeMenuPageComponent,
  normalizeMenuSource,
  normalizePositiveInteger,
  normalizeString,
  toCamelCase
} from './menuConfigNormalization.js'

import {
  getBuiltInMenuPages,
  getCustomMenuPages,
  getDefaultMenuPages,
  getMenuPagePath,
  getPrimaryMenuPage,
  getPrimaryMenuPagePath,
  resolveMenuPage,
  resolveMenuPageRegistry,
  resolveMenuPages,
  resolvePrimaryMenuPage
} from './menuPageRegistry.js'

const menuSourceRegistry = new Map()

function createResolvedMenuItem({
  key,
  label,
  target,
  matchPath = '',
  badge = '',
  meta = '',
  icon = '',
  description = '',
  menuGroup = 'auto',
  menuOrder = 0,
  children = []
}) {
  const normalizedLabel = normalizeString(label)
  const normalizedTarget = normalizeString(target)
  const normalizedChildren = normalizeResolvedMenuItems(children)

  if (!normalizedLabel || (!normalizedTarget && normalizedChildren.length === 0)) {
    return null
  }

  const external = normalizedTarget ? isExternalTarget(normalizedTarget) : false

  return {
    key: normalizeString(key) || `${normalizedLabel}-${normalizedTarget}`,
    label: normalizedLabel,
    to: normalizedTarget && !external ? normalizedTarget : undefined,
    href: external ? normalizedTarget : undefined,
    external,
    matchPath: external ? '' : (normalizeString(matchPath) || normalizedTarget),
    badge: normalizeString(badge),
    meta: normalizeString(meta),
    icon: normalizeString(icon),
    description: normalizeString(description),
    menuGroup: normalizeMenuGroup(menuGroup, 'auto'),
    menuOrder: normalizePositiveInteger(menuOrder, 0),
    children: normalizedChildren
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
    meta: item.meta || item.description,
    icon: item.icon,
    description: item.description,
    menuGroup: item.menuGroup,
    menuOrder: item.menuOrder,
    children: normalizeMenuItemChildren(item.children)
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
  const children = normalizeMenuItemChildren(item.children)

  if (!target && children.length === 0) {
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

function isPageEnabled(context = {}, pageKey = '') {
  const normalizedPageKey = normalizePageKey(pageKey)

  if (!normalizedPageKey) {
    return false
  }

  const pageRegistry = isPlainObject(context.pageRegistry)
    ? context.pageRegistry
    : resolveMenuPageRegistry(context.menuConfig || {}, context.routePatterns || {})

  return Boolean(pageRegistry[normalizedPageKey])
}

function createPageMenuItem(page = {}, overrides = {}) {
  if (!isPlainObject(page)) {
    return null
  }

  return createResolvedMenuItem({
    key: overrides.key || page.key,
    label: overrides.label || overrides.name || overrides.title || page.label || page.title,
    target: overrides.target || overrides.to || overrides.path || overrides.href || page.path,
    matchPath: overrides.matchPath || page.path,
    badge: overrides.badge,
    meta: overrides.meta || overrides.description,
    icon: overrides.icon || page.icon,
    description: overrides.description || page.description,
    menuGroup: overrides.menuGroup || page.menuGroup,
    menuOrder: overrides.menuOrder || page.menuOrder,
    children: normalizeMenuItemChildren(overrides.children)
  })
}

function resolveBlogNavMenuItem(rawItem, index, navItems = []) {
  if (typeof rawItem === 'string') {
    const normalizedValue = normalizeString(rawItem)

    if (normalizedValue.includes('|')) {
      return parseCustomMenuItem(rawItem, index)
    }

    const page = navItems.find(item => item.key === normalizePageKey(normalizedValue))
    return page ? createPageMenuItem(page) : null
  }

  if (!isPlainObject(rawItem)) {
    return null
  }

  const item = toCamelCase(rawItem)
  const children = normalizeMenuItemChildren(item.children)
    .map((child, childIndex) => resolveBlogNavMenuItem(child, childIndex, navItems))
    .filter(Boolean)
  const pageKey = normalizePageKey(item.page || item.pageKey || item.key)
  const page = pageKey ? navItems.find(navItem => navItem.key === pageKey) : null

  if (page) {
    return createPageMenuItem(page, {
      ...item,
      children
    })
  }

  return createResolvedMenuItem({
    key: item.key || `blog-nav-item-${index + 1}`,
    label: item.label || item.name || item.title,
    target: item.target || item.to || item.path || item.href,
    matchPath: item.matchPath,
    badge: item.badge,
    meta: item.meta || item.description,
    icon: item.icon,
    description: item.description,
    menuGroup: item.menuGroup,
    menuOrder: item.menuOrder,
    children
  })
}

function sortBlogNavPages(pages = []) {
  return pages
    .map((page, index) => ({ page, index }))
    .sort((left, right) => (
      normalizePositiveInteger(left.page.menuOrder, Number.MAX_SAFE_INTEGER)
      - normalizePositiveInteger(right.page.menuOrder, Number.MAX_SAFE_INTEGER)
      || left.index - right.index
    ))
    .map(entry => entry.page)
}

function resolveBlogNavMenuSource(definition, context = {}) {
  const routePatterns = context.routePatterns || {}
  const sourceItems = Array.isArray(definition.items) ? definition.items : []
  const menuConfig = normalizeMenuConfig(context.menuConfig || {})
  const navItems = [
    ...resolveMenuPages(menuConfig, routePatterns),
    ...menuConfig.links
      .filter(link => link.enabled !== false)
      .map(link => ({
        ...link,
        path: link.target,
        title: link.label,
        builtIn: false,
        link: true
      }))
  ]

  if (sourceItems.length > 0) {
    return sourceItems
      .map((item, index) => resolveBlogNavMenuItem(item, index, navItems))
      .filter(Boolean)
  }

  return sortBlogNavPages(navItems.filter(item => item.visible !== false))
    .map(item => createPageMenuItem(item))
}

function resolveCategoriesMenuSource(definition, context = {}) {
  if (!isPageEnabled(context, 'categories')) {
    return []
  }

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
  if (!isPageEnabled(context, 'tags')) {
    return []
  }

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

function resolveAutomaticHeaderOverflow(entry, items) {
  if (
    entry.source !== 'blog-nav'
    || entry.items.length > 0
    || normalizePositiveInteger(entry.primaryLimit, 0) <= 0
  ) {
    return items
  }

  const primaryItems = items.filter(item => item.menuGroup !== 'more')
  const overflowItems = new Set(items.filter(item => item.menuGroup === 'more'))

  while (primaryItems.length > entry.primaryLimit) {
    let overflowIndex = -1

    for (let index = primaryItems.length - 1; index >= 0; index -= 1) {
      if (primaryItems[index].menuGroup !== 'primary') {
        overflowIndex = index
        break
      }
    }

    if (overflowIndex < 0) {
      break
    }

    overflowItems.add(primaryItems[overflowIndex])
    primaryItems.splice(overflowIndex, 1)
  }

  if (overflowItems.size === 0) {
    return primaryItems
  }

  const overflowChildren = items.filter(item => overflowItems.has(item))
  const overflowMenuItem = createResolvedMenuItem({
    key: `${entry.key}-overflow`,
    label: entry.overflowLabel || '更多',
    children: overflowChildren
  })

  return overflowMenuItem ? [...primaryItems, overflowMenuItem] : primaryItems
}

function resolveHeaderMenuCollection(entries, context = {}) {
  return entries
    .map((entry) => {
      const sourceItems = resolveMenuSourceItems(entry, context)
      const items = resolveAutomaticHeaderOverflow(entry, sourceItems)

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
        source: entry.source,
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

function createMenuDiagnostic(level, code, message, path) {
  return { level, code, message, path }
}

function resolveConfiguredMenuItemKey(rawItem, index) {
  if (typeof rawItem === 'string') {
    const value = normalizeString(rawItem)
    return value && !value.includes('|') ? normalizePageKey(value) : `custom-item-${index + 1}`
  }

  if (!isPlainObject(rawItem)) {
    return ''
  }

  const item = toCamelCase(rawItem)
  const hasTarget = Boolean(item.target || item.to || item.path || item.href)
  const hasChildren = Array.isArray(item.children) && item.children.length > 0
  const pageKey = normalizePageKey(
    item.page || item.pageKey || (!hasTarget && !hasChildren ? item.key : '')
  )

  return normalizeString(item.key || pageKey || `menu-item-${index + 1}`)
}

function validateMenuEntryItems(
  items,
  pageKeys,
  collectionPath,
  diagnostics,
  { depth = 1, maxDepth = 2, validatePageReferences = true } = {}
) {
  const normalizedItems = Array.isArray(items) ? items : []
  const siblingKeys = new Set()

  normalizedItems.forEach((rawItem, index) => {
    const itemPath = `${collectionPath}[${index}]`
    const itemKey = resolveConfiguredMenuItemKey(rawItem, index)

    if (itemKey && siblingKeys.has(itemKey)) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'duplicate-menu-item-key',
        `Menu item key "${itemKey}" is duplicated at the same level.`,
        `${itemPath}.key`
      ))
    }
    siblingKeys.add(itemKey)

    if (depth > maxDepth) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'menu-item-depth-exceeded',
        `Menu items support at most ${maxDepth} levels.`,
        itemPath
      ))
    }

    if (typeof rawItem === 'string') {
      const value = normalizeString(rawItem)

      if (
        validatePageReferences
        && value
        && !value.includes('|')
        && !pageKeys.has(normalizePageKey(value))
      ) {
        diagnostics.push(createMenuDiagnostic(
          'warning',
          'unknown-menu-page',
          `Menu item references unknown or disabled page "${value}".`,
          itemPath
        ))
      }
      return
    }

    if (!isPlainObject(rawItem)) {
      return
    }

    const item = toCamelCase(rawItem)
    const hasTarget = Boolean(item.target || item.to || item.path || item.href)
    const hasChildren = Array.isArray(item.children) && item.children.length > 0
    const explicitPageKey = normalizePageKey(
      item.page || item.pageKey || (!hasTarget && !hasChildren ? item.key : '')
    )

    if (validatePageReferences && explicitPageKey && !pageKeys.has(explicitPageKey)) {
      diagnostics.push(createMenuDiagnostic(
        'warning',
        'unknown-menu-page',
        `Menu item references unknown or disabled page "${explicitPageKey}".`,
        itemPath
      ))
    }

    validateMenuEntryItems(item.children, pageKeys, `${itemPath}.children`, diagnostics, {
      depth: depth + 1,
      maxDepth,
      validatePageReferences
    })
  })
}

function collectMenuPageReferences(items, pageKeys, references) {
  const normalizedItems = Array.isArray(items) ? items : []

  normalizedItems.forEach((rawItem) => {
    if (typeof rawItem === 'string') {
      const value = normalizeString(rawItem)
      const pageKey = !value.includes('|') ? normalizePageKey(value) : ''

      if (pageKeys.has(pageKey)) {
        references.add(pageKey)
      }
      return
    }

    if (!isPlainObject(rawItem)) {
      return
    }

    const item = toCamelCase(rawItem)
    const pageKey = normalizePageKey(item.page || item.pageKey || item.key)

    if (pageKeys.has(pageKey)) {
      references.add(pageKey)
    }

    collectMenuPageReferences(item.children, pageKeys, references)
  })
}

export function getMenuConfigDiagnostics(menuConfig = {}, routePatterns = {}, options = {}) {
  const normalizedMenuConfig = normalizeMenuConfig(menuConfig)
  const normalizedRoutePatterns = normalizeBlogRoutePatterns(routePatterns)
  const rawMenuConfig = isPlainObject(menuConfig) ? toCamelCase(menuConfig) : {}
  const rawPages = Array.isArray(rawMenuConfig.pages) ? rawMenuConfig.pages : []
  const rawLinks = Array.isArray(rawMenuConfig.links) ? rawMenuConfig.links : []
  const diagnostics = []
  const seenPageKeys = new Set()
  const duplicatePageKeys = new Set()

  normalizedMenuConfig.pages.forEach((page, index) => {
    if (seenPageKeys.has(page.key) && !duplicatePageKeys.has(page.key)) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'duplicate-menu-page-key',
        `Menu page key "${page.key}" is configured more than once.`,
        `menus.pages[${index}].key`
      ))
      duplicatePageKeys.add(page.key)
    }

    seenPageKeys.add(page.key)
  })

  rawPages.forEach((rawPage, index) => {
    if (!isPlainObject(rawPage)) {
      return
    }

    const component = normalizeString(rawPage.component).toLowerCase()
    const menuGroup = normalizeString(rawPage.menuGroup).toLowerCase()
    const menuOrder = Number(rawPage.menuOrder)
    const pageKey = normalizePageKey(rawPage.key || rawPage.id)
    const configuredPath = normalizeString(rawPage.path || rawPage.to || rawPage.href)

    if (!pageKey) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'missing-menu-page-key',
        'Menu page key is required.',
        `menus.pages[${index}].key`
      ))
    } else if (!isValidMenuPageKey(pageKey)) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'invalid-menu-page-key',
        `Menu page key "${pageKey}" may contain only letters, numbers, underscores, and hyphens.`,
        `menus.pages[${index}].key`
      ))
    }

    if (configuredPath && !normalizeMenuPagePath(configuredPath, '')) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'invalid-menu-page-path',
        `Menu page path "${configuredPath}" is not a safe static path.`,
        `menus.pages[${index}].path`
      ))
    }

    if (component && !isMenuPageComponentKey(component)) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'unknown-menu-page-component',
        `Menu page component "${component}" is not supported.`,
        `menus.pages[${index}].component`
      ))
    }

    if (menuGroup && !MENU_GROUPS.has(menuGroup)) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'unknown-menu-group',
        `Menu group "${menuGroup}" must be auto, primary, or more.`,
        `menus.pages[${index}].menuGroup`
      ))
    }

    if (
      rawPage.menuOrder !== undefined
      && (!Number.isInteger(menuOrder) || menuOrder <= 0)
    ) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'invalid-menu-order',
        'Menu order must be a positive integer.',
        `menus.pages[${index}].menuOrder`
      ))
    }
  })

  const menuItemKeys = new Set([
    ...getDefaultMenuPages(normalizedRoutePatterns).map(page => page.key),
    ...normalizedMenuConfig.pages.map(page => page.key)
  ])
  rawLinks.forEach((rawLink, index) => {
    if (!isPlainObject(rawLink)) return

    const link = toCamelCase(rawLink)
    const key = normalizePageKey(link.key || link.id)
    const label = normalizeString(link.label || link.name || link.title)
    const target = normalizeString(link.target || link.to || link.href || link.path)
    const normalizedTarget = normalizeMenuLinkTarget(target)

    if (!key || !isValidMenuPageKey(key)) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'invalid-menu-link-key',
        'Menu link key may contain only letters, numbers, underscores, and hyphens.',
        `menus.links[${index}].key`
      ))
    } else if (menuItemKeys.has(key)) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'duplicate-menu-link-key',
        `Menu link key "${key}" is already used.`,
        `menus.links[${index}].key`
      ))
    } else {
      menuItemKeys.add(key)
    }

    if (!label) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'missing-menu-link-label',
        'Menu link label is required.',
        `menus.links[${index}].label`
      ))
    }

    if (!target || !normalizedTarget) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'invalid-menu-link-target',
        'Menu link target must be a safe site path or an HTTP, email, or phone link.',
        `menus.links[${index}].target`
      ))
    }
  })

  const builtInPages = getDefaultMenuPages(normalizedRoutePatterns).filter((page) => {
    const override = normalizedMenuConfig.pages.find(entry => entry.key === page.key)
    return override?.enabled !== false
  })
  const usedPaths = new Map(builtInPages.map(page => [page.path, page.key]))
  const reservedPath = normalizeMenuPagePath(normalizedRoutePatterns.notFound, '')
  const reservedDynamicRoutes = getDynamicBlogRoutePatterns(normalizedRoutePatterns)
  const customRoutes = []

  normalizedMenuConfig.pages.forEach((page, index) => {
    if (BUILT_IN_MENU_PAGE_KEYS.has(page.key) || page.enabled === false || duplicatePageKeys.has(page.key)) {
      return
    }

    const path = normalizeMenuPagePath(page.path, `/${page.key}`)
    const pathOwner = usedPaths.get(path)

    if (path && (path === reservedPath || pathOwner)) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'duplicate-menu-page-path',
        pathOwner
          ? `Menu page path "${path}" is already used by page "${pathOwner}".`
          : `Menu page path "${path}" conflicts with the not-found route.`,
        `menus.pages[${index}].path`
      ))
      return
    }

    const resolvedPage = {
      ...page,
      path,
      component: normalizeMenuPageComponent(page.component, 'context')
    }
    const pageRoutes = getCustomMenuPageRoutePatterns(resolvedPage)
    const enabledBuiltInRoutes = builtInPages.map(entry => ({
      key: entry.key,
      pattern: entry.path,
      type: 'page'
    }))
    const routeConflict = findOverlappingRoute(
      pageRoutes,
      [...enabledBuiltInRoutes, ...reservedDynamicRoutes, ...customRoutes]
    )

    if (routeConflict) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'conflicting-menu-page-route',
        `Menu page route "${routeConflict.route.pattern}" conflicts with route "${routeConflict.conflict.pattern}".`,
        `menus.pages[${index}].path`
      ))
      return
    }

    if (path) {
      usedPaths.set(path, page.key)
      customRoutes.push(...pageRoutes)
    }
  })

  const configuredRenderers = new Set(
    Array.isArray(options.renderers)
      ? options.renderers.map(renderer => normalizeString(renderer)).filter(Boolean)
      : DEFAULT_MENU_RENDERER_NAMES
  )
  const resolvedPages = resolveMenuPages(normalizedMenuConfig, normalizedRoutePatterns)
  const resolvedPageKeys = new Set(resolvedPages.map(page => page.key))

  normalizedMenuConfig.header.forEach((entry, index) => {
    if (entry.source !== 'blog-nav' || entry.items.length > 0 || entry.primaryLimit <= 0) {
      return
    }

    const primaryPages = resolvedPages.filter(page => (
      page.visible !== false && page.menuGroup === 'primary'
    ))

    if (primaryPages.length > entry.primaryLimit) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'too-many-primary-menu-pages',
        `Primary menu pages (${primaryPages.map(page => page.key).join(', ')}) exceed the limit of ${entry.primaryLimit}.`,
        `menus.header[${index}].primaryLimit`
      ))
    }
  })

  resolvedPages.forEach((page) => {
    if (page.builtIn || page.enabled === false) {
      return
    }

    const pageIndex = normalizedMenuConfig.pages.findIndex(entry => entry.key === page.key)
    const pagePath = `menus.pages[${Math.max(pageIndex, 0)}]`

    if (page.component === 'context' && !page.file && !page.content) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'missing-menu-page-file',
        `Context page "${page.key}" requires file or inline content.`,
        `${pagePath}.file`
      ))
    }

    if (
      MENU_COLLECTION_PAGE_COMPONENTS.has(page.component)
      && !page.folder
      && page.items.length === 0
    ) {
      diagnostics.push(createMenuDiagnostic(
        'error',
        'missing-menu-page-folder',
        `Collection page "${page.key}" requires folder or inline items.`,
        `${pagePath}.folder`
      ))
    }
  })

  const collectionKeys = ['header', 'mobileHeader', 'sidebar']

  collectionKeys.forEach((collectionKey) => {
    const entries = normalizedMenuConfig[collectionKey]
    const seenEntryKeys = new Set()

    entries.forEach((entry, index) => {
      const entryPath = `menus.${collectionKey}[${index}]`

      if (seenEntryKeys.has(entry.key)) {
        diagnostics.push(createMenuDiagnostic(
          'error',
          'duplicate-menu-entry-key',
          `Menu entry key "${entry.key}" is duplicated in ${collectionKey}.`,
          `${entryPath}.key`
        ))
      }
      seenEntryKeys.add(entry.key)

      if (!resolveMenuSource(entry.source)) {
        diagnostics.push(createMenuDiagnostic(
          'warning',
          'unknown-menu-source',
          `Menu source "${entry.source}" is not registered.`,
          `${entryPath}.source`
        ))
      }

      if (!configuredRenderers.has(entry.renderer)) {
        diagnostics.push(createMenuDiagnostic(
          'warning',
          'unknown-menu-renderer',
          `Menu renderer "${entry.renderer}" is not registered for the site build.`,
          `${entryPath}.renderer`
        ))
      }

      if (entry.items.length > 0) {
        validateMenuEntryItems(entry.items, resolvedPageKeys, `${entryPath}.items`, diagnostics, {
          maxDepth: collectionKey === 'sidebar' ? 1 : 2,
          validatePageReferences: entry.source === 'blog-nav'
        })
      }
    })

    const rawEntries = rawMenuConfig[collectionKey]
    const hasExplicitItems = Array.isArray(rawEntries) && rawEntries.some(entry => (
      isPlainObject(entry) && Array.isArray(entry.items) && entry.items.length > 0
    ))

    if (!hasExplicitItems || collectionKey === 'sidebar') {
      return
    }

    const references = new Set()
    entries.forEach((entry) => {
      if (entry.source === 'blog-nav') {
        collectMenuPageReferences(entry.items, resolvedPageKeys, references)
      }
    })

    resolvedPages
      .filter(page => page.visible !== false && !references.has(page.key))
      .forEach((page) => {
        diagnostics.push(createMenuDiagnostic(
          'warning',
          'unreferenced-visible-page',
          `Visible page "${page.key}" is omitted from the explicit ${collectionKey} menu.`,
          `menus.${collectionKey}`
        ))
      })
  })

  return diagnostics
}

export function getDefaultMenuConfig() {
  return normalizeMenuConfig()
}

export {
  BUILT_IN_MENU_PAGE_KEYS,
  DEFAULT_MENU_CONFIG,
  DEFAULT_MENU_RENDERER_NAMES,
  getBuiltInMenuPages,
  getCustomMenuPages,
  getDefaultMenuPages,
  getMenuPagePath,
  getPrimaryMenuPage,
  getPrimaryMenuPagePath,
  normalizeMenuConfig,
  resolveMenuPage,
  resolveMenuPageRegistry,
  resolveMenuPages,
  resolvePrimaryMenuPage
}
