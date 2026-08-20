const SIDEBAR_MENU_COMPONENTS = Object.freeze([
  'categories',
  'tags',
  'latest-articles',
  'friend-links',
  'custom'
])

const SIDEBAR_COMPONENT_KEYS = Object.freeze([
  'profile',
  'announcement',
  'search',
  ...SIDEBAR_MENU_COMPONENTS
])

const SIDEBAR_COMPONENT_KEY_SET = new Set(SIDEBAR_COMPONENT_KEYS)
const SIDEBAR_MENU_COMPONENT_KEY_SET = new Set(SIDEBAR_MENU_COMPONENTS)

export const DEFAULT_SIDEBAR_LAYOUT = Object.freeze({
  desktopComponents: Object.freeze(['profile', 'announcement', 'search', 'latest-articles', 'categories', 'tags']),
  articleDesktopComponents: Object.freeze(['profile', 'announcement', 'search', 'latest-articles', 'categories', 'tags']),
  mobileComponents: Object.freeze(['profile', 'search', 'latest-articles', 'categories', 'tags']),
  articleMobileComponents: Object.freeze(['profile', 'announcement', 'search', 'latest-articles', 'categories', 'tags'])
})

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function pushUniqueComponent(target, componentKey) {
  if (!componentKey || target.includes(componentKey)) {
    return
  }

  target.push(componentKey)
}

function normalizeSidebarComponentKey(value) {
  const normalizedValue = String(value || '').trim().toLowerCase()

  if (!normalizedValue || normalizedValue.includes('_')) {
    return ''
  }

  return SIDEBAR_COMPONENT_KEY_SET.has(normalizedValue)
    ? normalizedValue
    : ''
}

function normalizeSidebarComponentList(value, fallbackComponents) {
  if (!Array.isArray(value)) {
    return [...fallbackComponents]
  }

  const normalizedComponents = []

  value.forEach((component) => {
    pushUniqueComponent(normalizedComponents, normalizeSidebarComponentKey(component))
  })

  return normalizedComponents
}

function resolveSidebarComponentList(sidebar, componentKeys, fallbackComponents) {
  const explicitComponentValue = componentKeys
    .map((key) => sidebar[key])
    .find((value) => value !== undefined)

  if (explicitComponentValue !== undefined) {
    return normalizeSidebarComponentList(explicitComponentValue, fallbackComponents)
  }

  return [...fallbackComponents]
}

function hasSidebarComponentList(sidebar, componentKeys) {
  return componentKeys.some((key) => sidebar[key] !== undefined)
}

export function normalizeSidebarLayout(sidebar = {}) {
  const normalizedSidebar = isPlainObject(sidebar) ? sidebar : {}
  const desktopComponentKeys = ['desktop_components', 'desktopComponents']
  const mobileComponentKeys = ['mobile_components', 'mobileComponents']

  const desktopComponents = resolveSidebarComponentList(
    normalizedSidebar,
    desktopComponentKeys,
    DEFAULT_SIDEBAR_LAYOUT.desktopComponents
  )
  const mobileComponents = resolveSidebarComponentList(
    normalizedSidebar,
    mobileComponentKeys,
    DEFAULT_SIDEBAR_LAYOUT.mobileComponents
  )

  const articleDesktopFallback = hasSidebarComponentList(normalizedSidebar, desktopComponentKeys)
    ? desktopComponents
    : DEFAULT_SIDEBAR_LAYOUT.articleDesktopComponents
  const articleMobileFallback = hasSidebarComponentList(normalizedSidebar, mobileComponentKeys)
    ? mobileComponents
    : DEFAULT_SIDEBAR_LAYOUT.articleMobileComponents

  return {
    desktopComponents,
    articleDesktopComponents: resolveSidebarComponentList(
      normalizedSidebar,
      ['article_desktop_components', 'articleDesktopComponents'],
      articleDesktopFallback
    ),
    mobileComponents,
    articleMobileComponents: resolveSidebarComponentList(
      normalizedSidebar,
      ['article_mobile_components', 'articleMobileComponents'],
      articleMobileFallback
    )
  }
}

export function resolveSidebarComponents(sidebarLayout = {}, { mobile = false, article = false } = {}) {
  const normalizedLayout = normalizeSidebarLayout(sidebarLayout)

  if (mobile) {
    return article
      ? [...normalizedLayout.articleMobileComponents]
      : [...normalizedLayout.mobileComponents]
  }

  return article
    ? [...normalizedLayout.articleDesktopComponents]
    : [...normalizedLayout.desktopComponents]
}

function createSidebarDiagnostic(level, code, message, path) {
  return { level, code, message, path }
}

export function getSidebarLayoutDiagnostics(sidebar = {}) {
  const normalizedSidebar = isPlainObject(sidebar) ? sidebar : {}
  const diagnostics = []
  const collections = [
    ['desktop_components', 'desktopComponents'],
    ['article_desktop_components', 'articleDesktopComponents'],
    ['mobile_components', 'mobileComponents'],
    ['article_mobile_components', 'articleMobileComponents']
  ]

  collections.forEach(([snakeKey, camelKey]) => {
    const key = normalizedSidebar[snakeKey] !== undefined ? snakeKey : camelKey
    const value = normalizedSidebar[key]

    if (value === undefined) {
      return
    }

    if (!Array.isArray(value)) {
      diagnostics.push(createSidebarDiagnostic(
        'error',
        'invalid-sidebar-component-list',
        `Sidebar field "${key}" must be an array.`,
        `sidebar.${key}`
      ))
      return
    }

    const seenComponents = new Set()
    value.forEach((component, index) => {
      const componentKey = String(component || '').trim().toLowerCase()
      const componentPath = `sidebar.${key}[${index}]`

      if (!SIDEBAR_COMPONENT_KEY_SET.has(componentKey)) {
        diagnostics.push(createSidebarDiagnostic(
          'error',
          'unknown-sidebar-component',
          `Sidebar component "${componentKey || component}" is not supported.`,
          componentPath
        ))
        return
      }

      if (seenComponents.has(componentKey)) {
        diagnostics.push(createSidebarDiagnostic(
          'warning',
          'duplicate-sidebar-component',
          `Sidebar component "${componentKey}" is configured more than once.`,
          componentPath
        ))
      }
      seenComponents.add(componentKey)
    })
  })

  return diagnostics
}

export function getSidebarMenuLayoutDiagnostics(sidebar = {}, menuConfig = {}) {
  const layout = normalizeSidebarLayout(sidebar)
  const activeComponents = new Set(Object.values(layout).flat())
  const entries = Array.isArray(menuConfig?.sidebar) ? menuConfig.sidebar : []
  const configuredComponents = new Set()
  const diagnostics = []

  entries.forEach((entry, index) => {
    const source = String(entry?.source || '').trim().toLowerCase()
    const componentKey = SIDEBAR_MENU_COMPONENT_KEY_SET.has(source) ? source : 'custom'
    configuredComponents.add(componentKey)

    if (!activeComponents.has(componentKey)) {
      diagnostics.push(createSidebarDiagnostic(
        'warning',
        'unreachable-sidebar-menu',
        `Sidebar menu source "${source}" is configured but no sidebar component list includes "${componentKey}".`,
        `menus.sidebar[${index}].source`
      ))
    }
  })

  activeComponents.forEach((componentKey) => {
    if (SIDEBAR_MENU_COMPONENT_KEY_SET.has(componentKey) && !configuredComponents.has(componentKey)) {
      diagnostics.push(createSidebarDiagnostic(
        'warning',
        'missing-sidebar-menu',
        `Sidebar component "${componentKey}" has no matching menus.sidebar entry.`,
        'sidebar'
      ))
    }
  })

  return diagnostics
}

export {
  SIDEBAR_COMPONENT_KEYS,
  SIDEBAR_MENU_COMPONENTS
}
