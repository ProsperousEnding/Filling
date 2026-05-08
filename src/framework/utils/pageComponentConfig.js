const BUILT_IN_PAGE_DEFAULT_COMPONENTS = Object.freeze({
  home: 'list',
  articles: 'card',
  categories: 'grid',
  tags: 'list',
  archive: 'timeline'
})

const MENU_PAGE_COMPONENT_KEYS = Object.freeze(['context', 'list', 'card', 'grid', 'timeline', 'friends'])
const MENU_PAGE_COMPONENT_KEY_SET = new Set(MENU_PAGE_COMPONENT_KEYS)

function normalizeString(value) {
  return String(value || '').trim().toLowerCase()
}

export { BUILT_IN_PAGE_DEFAULT_COMPONENTS, MENU_PAGE_COMPONENT_KEYS }

export function isMenuPageComponentKey(value) {
  return MENU_PAGE_COMPONENT_KEY_SET.has(normalizeString(value))
}

export function resolveBuiltInPageComponentKey(pageKey, requestedComponent) {
  const normalizedPageKey = normalizeString(pageKey)
  const normalizedComponent = normalizeString(requestedComponent)

  if (
    normalizedComponent
    && normalizedComponent !== 'context'
    && MENU_PAGE_COMPONENT_KEY_SET.has(normalizedComponent)
  ) {
    return normalizedComponent
  }

  return BUILT_IN_PAGE_DEFAULT_COMPONENTS[normalizedPageKey] || 'list'
}

export function resolveMenuPageComponentKey(requestedComponent) {
  const normalizedComponent = normalizeString(requestedComponent)

  if (normalizedComponent && MENU_PAGE_COMPONENT_KEY_SET.has(normalizedComponent)) {
    return normalizedComponent
  }

  return 'context'
}
