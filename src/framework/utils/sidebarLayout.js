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

export const DEFAULT_SIDEBAR_LAYOUT = Object.freeze({
  desktopComponents: Object.freeze(['profile', 'announcement', 'search', 'categories', 'tags', 'latest-articles']),
  articleDesktopComponents: Object.freeze(['profile', 'announcement', 'search', 'categories', 'tags', 'latest-articles']),
  mobileComponents: Object.freeze(['profile', 'search', 'categories', 'tags', 'latest-articles']),
  articleMobileComponents: Object.freeze(['profile', 'announcement', 'search', 'categories', 'tags', 'latest-articles'])
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

export function normalizeSidebarLayout(sidebar = {}) {
  const normalizedSidebar = isPlainObject(sidebar) ? sidebar : {}

  const desktopComponents = resolveSidebarComponentList(
    normalizedSidebar,
    ['desktop_components', 'desktopComponents'],
    DEFAULT_SIDEBAR_LAYOUT.desktopComponents
  )
  const mobileComponents = resolveSidebarComponentList(
    normalizedSidebar,
    ['mobile_components', 'mobileComponents'],
    DEFAULT_SIDEBAR_LAYOUT.mobileComponents
  )

  return {
    desktopComponents,
    articleDesktopComponents: resolveSidebarComponentList(
      normalizedSidebar,
      ['article_desktop_components', 'articleDesktopComponents'],
      desktopComponents
    ),
    mobileComponents,
    articleMobileComponents: resolveSidebarComponentList(
      normalizedSidebar,
      ['article_mobile_components', 'articleMobileComponents'],
      mobileComponents
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
