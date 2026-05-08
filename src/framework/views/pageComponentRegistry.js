import FriendLinksPage from './pageComponents/FriendLinksPage.vue'
import MenuPageCardPage from './pageComponents/MenuPageCardPage.vue'
import MenuPageContextPage from './pageComponents/MenuPageContextPage.vue'
import MenuPageGridPage from './pageComponents/MenuPageGridPage.vue'
import MenuPageListPage from './pageComponents/MenuPageListPage.vue'
import MenuPageTimelinePage from './pageComponents/MenuPageTimelinePage.vue'
import {
  resolveBuiltInPageComponentKey,
  resolveMenuPageComponentKey
} from '../utils/pageComponentConfig.js'

export { resolveBuiltInPageComponentKey, resolveMenuPageComponentKey }

const MENU_PAGE_COMPONENTS = Object.freeze({
  context: MenuPageContextPage,
  list: MenuPageListPage,
  card: MenuPageCardPage,
  grid: MenuPageGridPage,
  timeline: MenuPageTimelinePage,
  friends: FriendLinksPage
})

export function resolveBuiltInPageComponent(pageKey, requestedComponent) {
  const componentKey = resolveBuiltInPageComponentKey(pageKey, requestedComponent)
  return MENU_PAGE_COMPONENTS[componentKey] || MenuPageListPage
}

export function resolveMenuPageComponent(requestedComponent) {
  const componentKey = resolveMenuPageComponentKey(requestedComponent)
  return MENU_PAGE_COMPONENTS[componentKey] || MenuPageContextPage
}
