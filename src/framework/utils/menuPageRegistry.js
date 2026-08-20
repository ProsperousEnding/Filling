import { normalizeBlogRoutePatterns } from './routeLinks.js'
import {
  findOverlappingRoute,
  getCustomMenuPageRoutePatterns,
  getDynamicBlogRoutePatterns,
  normalizeMenuContentPath,
  normalizeMenuPageKey as normalizePageKey,
  normalizeMenuPagePath
} from './menuRouteConfig.js'
import { DEFAULT_MENU_PAGES } from './menuDefaults.js'
import {
  normalizeMenuConfig,
  normalizeMenuGroup,
  normalizeMenuPageComponent,
  normalizePositiveInteger,
  normalizeString
} from './menuConfigNormalization.js'

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
    case 'search':
      return normalizeMenuPagePath(routePatterns.search, '/search')
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
    enabled: definition.enabled !== false,
    visible: definition.visible !== false,
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
  const normalizedRoutePatterns = normalizeBlogRoutePatterns(routePatterns)
  const defaultPages = getDefaultMenuPages(normalizedRoutePatterns)
  const resolvedPages = []
  const resolvedKeys = new Set()
  const reservedPaths = new Set(
    [normalizeMenuPagePath(normalizedRoutePatterns.notFound, '')]
      .filter(Boolean)
  )
  const reservedDynamicRoutes = getDynamicBlogRoutePatterns(normalizedRoutePatterns)
  const customRoutes = []

  defaultPages.forEach((defaultPage) => {
    const override = normalizedMenuConfig.pages.find(page => page.key === defaultPage.key) || null
    const enabled = typeof override?.enabled === 'boolean' ? override.enabled : defaultPage.enabled !== false

    if (!enabled) {
      resolvedKeys.add(defaultPage.key)
      return
    }

    resolvedPages.push({
      ...defaultPage,
      label: normalizeString(override?.label || defaultPage.label) || defaultPage.label,
      title: normalizeString(override?.title || defaultPage.title) || defaultPage.title,
      component: normalizeMenuPageComponent(override?.component, defaultPage.component),
      menuGroup: normalizeMenuGroup(override?.menuGroup, defaultPage.menuGroup),
      menuOrder: normalizePositiveInteger(override?.menuOrder, defaultPage.menuOrder),
      description: normalizeString(override?.description || defaultPage.description),
      enabled: true,
      visible: typeof override?.visible === 'boolean' ? override.visible : defaultPage.visible !== false
    })
    resolvedKeys.add(defaultPage.key)
  })

  const usedPaths = new Set(resolvedPages.map(page => page.path))

  normalizedMenuConfig.pages.forEach((page, index) => {
    if (resolvedKeys.has(page.key)) {
      return
    }

    const path = normalizeMenuPagePath(page.path, `/${page.key}`)
    const label = normalizeString(page.label || page.title || page.key)
    const title = normalizeString(page.title || page.label || page.key)
    const enabled = page.enabled !== false

    if (!enabled || !page.key || !path || !label || !title) {
      return
    }

    if (reservedPaths.has(path) || usedPaths.has(path)) {
      return
    }

    const resolvedPage = {
      key: page.key,
      label,
      title,
      path,
      component: normalizeMenuPageComponent(page.component, 'context'),
      menuGroup: normalizeMenuGroup(page.menuGroup, 'more'),
      menuOrder: normalizePositiveInteger(page.menuOrder, 1000 + index),
      description: normalizeString(page.description),
      enabled: true,
      visible: page.visible !== false,
      content: normalizeString(page.content),
      items: Array.isArray(page.items) ? page.items.map(item => ({ ...item })) : [],
      file: normalizeMenuContentPath(page.file, 'file'),
      folder: normalizeMenuContentPath(page.folder, 'folder'),
      application: page.application,
      builtIn: false
    }
    const pageRoutes = getCustomMenuPageRoutePatterns(resolvedPage)
    const enabledBuiltInRoutes = resolvedPages
      .filter(entry => entry.builtIn)
      .map(entry => ({ key: entry.key, pattern: entry.path }))

    if (findOverlappingRoute(pageRoutes, [...enabledBuiltInRoutes, ...reservedDynamicRoutes, ...customRoutes])) {
      return
    }

    resolvedPages.push(resolvedPage)
    resolvedKeys.add(page.key)
    usedPaths.add(path)
    customRoutes.push(...pageRoutes)
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

export function getBuiltInMenuPages(menuConfig = {}, routePatterns = {}) {
  return resolveMenuPages(menuConfig, routePatterns)
    .filter(page => page.builtIn)
}

export function resolveMenuPageRegistry(menuConfig = {}, routePatterns = {}) {
  return resolveMenuPages(menuConfig, routePatterns).reduce((registry, page) => {
    registry[page.key] = { ...page }
    return registry
  }, {})
}

export function resolvePrimaryMenuPage(menuConfig = {}, routePatterns = {}) {
  const pages = resolveMenuPages(menuConfig, routePatterns)

  return (
    pages.find(page => page.key === 'home')
    || pages.find(page => page.visible !== false)
    || pages[0]
    || null
  )
}

export function getPrimaryMenuPage(menuConfig = {}, routePatterns = {}) {
  return resolvePrimaryMenuPage(menuConfig, routePatterns)
}

export function getPrimaryMenuPagePath(menuConfig = {}, routePatterns = {}) {
  return resolvePrimaryMenuPage(menuConfig, routePatterns)?.path || '/'
}

export function getMenuPagePath(pageOrKey, menuConfig = {}, routePatterns = {}) {
  return resolveMenuPage(pageOrKey, menuConfig, routePatterns)?.path || '/'
}
