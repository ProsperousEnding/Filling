import { RouterLink } from 'vue-router'

export function normalizeMenuItem(item, index = 0) {
  const children = (Array.isArray(item?.children) ? item.children : [])
    .map(normalizeMenuItem)
    .filter(child => child.label)

  return {
    key: item?.key || item?.path || item?.name || `menu-item-${index}`,
    label: item?.name || item?.label || '',
    to: item?.to || item?.path || '',
    href: item?.href || '',
    external: item?.external === true,
    matchPath: item?.matchPath || item?.path || item?.to || '',
    icon: item?.icon || '',
    description: item?.description || '',
    meta: item?.meta || '',
    children
  }
}

export function normalizeMenuItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .map(normalizeMenuItem)
    .filter(item => item.label)
}

export function hasMenuItemTarget(item) {
  return Boolean(item?.to || item?.href)
}

export function getMenuItemComponent(item, groupComponent = 'button') {
  if (!hasMenuItemTarget(item)) {
    return item?.children?.length > 0 ? groupComponent : 'button'
  }

  return item.external ? 'a' : RouterLink
}

export function getMenuItemTo(item) {
  return item?.external || !item?.to ? undefined : item.to
}

export function getMenuItemHref(item) {
  return item?.external ? item.href : undefined
}

export function isMenuItemActive(item, activePath) {
  if (Array.isArray(item?.children) && item.children.some(child => isMenuItemActive(child, activePath))) {
    return true
  }

  const currentPath = String(activePath || '')
  const targetPath = String(item?.matchPath || item?.to || '')

  if (!currentPath || !targetPath) {
    return false
  }

  if (targetPath === '/') {
    return currentPath === '/'
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}
