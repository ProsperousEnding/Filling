import { defineAsyncComponent } from 'vue'
import {
  resolveBuiltInPageComponentKey,
  resolveMenuPageComponentKey
} from '../utils/pageComponentConfig.js'

export { resolveBuiltInPageComponentKey, resolveMenuPageComponentKey }

function createPageComponent(loader) {
  return defineAsyncComponent({
    loader,
    delay: 0
  })
}

const ArchiveTimelinePage = createPageComponent(() => import('./pageComponents/ArchiveTimelinePage.vue'))
const MenuPageContextPage = createPageComponent(() => import('./pageComponents/MenuPageContextPage.vue'))
const MenuPageListPage = createPageComponent(() => import('./pageComponents/MenuPageListPage.vue'))

const MENU_PAGE_COMPONENTS = Object.freeze({
  context: MenuPageContextPage,
  list: MenuPageListPage,
  card: createPageComponent(() => import('./pageComponents/MenuPageCardPage.vue')),
  grid: createPageComponent(() => import('./pageComponents/MenuPageGridPage.vue')),
  timeline: createPageComponent(() => import('./pageComponents/MenuPageTimelinePage.vue')),
  friends: createPageComponent(() => import('./pageComponents/FriendLinksPage.vue')),
  guestbook: createPageComponent(() => import('./pageComponents/GuestbookPage.vue')),
  sponsor: createPageComponent(() => import('./pageComponents/SponsorPage.vue'))
})

export function resolveBuiltInPageComponent(pageKey, requestedComponent) {
  const componentKey = resolveBuiltInPageComponentKey(pageKey, requestedComponent)
  if (pageKey === 'archive' && componentKey === 'timeline') {
    return ArchiveTimelinePage
  }
  return MENU_PAGE_COMPONENTS[componentKey] || MenuPageListPage
}

export function resolveMenuPageComponent(requestedComponent) {
  const componentKey = resolveMenuPageComponentKey(requestedComponent)
  return MENU_PAGE_COMPONENTS[componentKey] || MenuPageContextPage
}
