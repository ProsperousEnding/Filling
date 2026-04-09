import HeaderPillMenu from './renderers/HeaderPillMenu.vue'
import HeaderStackMenu from './renderers/HeaderStackMenu.vue'
import SidebarArticleMenu from './renderers/SidebarArticleMenu.vue'
import SidebarLinkMenu from './renderers/SidebarLinkMenu.vue'

const menuRendererRegistry = new Map([
  ['header-pill', HeaderPillMenu],
  ['header-stack', HeaderStackMenu],
  ['sidebar-link', SidebarLinkMenu],
  ['sidebar-article', SidebarArticleMenu]
])

export function registerMenuRenderer(name, component) {
  const normalizedName = String(name || '').trim()

  if (!normalizedName || !component) {
    return false
  }

  menuRendererRegistry.set(normalizedName, component)
  return true
}

export function resolveMenuRenderer(name) {
  return menuRendererRegistry.get(String(name || '').trim()) || null
}

export function getRegisteredMenuRenderers() {
  return Array.from(menuRendererRegistry.keys())
}

export {
  HeaderPillMenu,
  HeaderStackMenu,
  SidebarArticleMenu,
  SidebarLinkMenu
}
