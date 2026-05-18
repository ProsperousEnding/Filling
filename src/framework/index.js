import { createPinia } from 'pinia'

import BlogContainer from './components/core/BlogContainer.vue'
import ArticleCard from './components/core/ArticleCard.vue'
import TagCloud from './components/core/TagCloud.vue'
import Pagination from './components/core/Pagination.vue'
import Header from './components/layout/Header.vue'
import Footer from './components/layout/Footer.vue'
import Sidebar from './components/layout/Sidebar.vue'
import MenuRenderer from './components/menu/MenuRenderer.vue'
import {
  HeaderPillMenu,
  HeaderStackMenu,
  SidebarArticleMenu,
  SidebarLinkMenu,
  getRegisteredMenuRenderers,
  registerMenuRenderer,
  resolveMenuRenderer
} from './components/menu/menuRegistry'
import {
  createMenuItem,
  getPrimaryMenuPagePath,
  getPrimaryMenuPage,
  getBuiltInMenuPages,
  getCustomMenuPages,
  getDefaultMenuConfig,
  getDefaultMenuPages,
  getMaxMenuSourceLimit,
  getRegisteredMenuSources,
  getMenuPagePath,
  menuUsesSource,
  normalizeMenuConfig,
  registerMenuSource,
  resolveHeaderMenuGroups,
  resolveMenuPage,
  resolveMenuPageRegistry,
  resolveMenuPages,
  resolveMenuSource,
  resolveMobileHeaderMenuGroups,
  resolveSidebarMenuSections
} from './utils/menuConfig'
import {
  BLOG_NAV_ITEMS,
  BLOG_PATH_PATTERNS,
  BLOG_ROUTE_NAMES,
  blogRoutes,
  configureBlogRoutePatterns,
  createBlogRouter,
  createBlogRoutes,
  getArchivePath,
  getArchiveYearPath,
  getArchiveRoute,
  getArticlePath,
  getArticleRoute,
  getArticlesPath,
  getArticlesPagePath,
  getArticlesRoute,
  getBlogNavItems,
  getBlogPathPatterns,
  getCategoriesPath,
  getCategoriesRoute,
  getCategoryPath,
  getCategoryPagePath,
  getCategoryRoute,
  getHomePath,
  getHomeRoute,
  getNotFoundPath,
  getSearchPath,
  getSearchRoute,
  getTagPath,
  getTagPagePath,
  getTagRoute,
  getTagsPath,
  getTagsRoute,
  normalizeBlogRoutePatterns,
  resetBlogRoutePatterns,
  resolveArticleId,
  resolveCategoryId,
  resolveTagId
} from './router'
import { useArticleStore } from './stores/article'
import { useCategoryStore } from './stores/category'
import { useTagStore } from './stores/tag'
import { useConfigStore } from './stores/config'
import { useSearchStore } from './stores/search'

import './style.css'

const install = (app, options = {}) => {
  app.component('BlogContainer', BlogContainer)
  app.component('ArticleCard', ArticleCard)
  app.component('TagCloud', TagCloud)
  app.component('Pagination', Pagination)
  app.component('BlogHeader', Header)
  app.component('BlogFooter', Footer)
  app.component('BlogSidebar', Sidebar)
  app.component('BlogMenuRenderer', MenuRenderer)
  app.component('BlogHeaderPillMenu', HeaderPillMenu)
  app.component('BlogHeaderStackMenu', HeaderStackMenu)
  app.component('BlogSidebarLinkMenu', SidebarLinkMenu)
  app.component('BlogSidebarArticleMenu', SidebarArticleMenu)

  const pinia = app.config.globalProperties.$pinia || createPinia()
  if (!app.config.globalProperties.$pinia) {
    app.use(pinia)
  }

  const configStore = useConfigStore(pinia)
  if (Object.keys(options).length > 0) {
    configStore.initConfig(options)
  }
}

export {
  install,
  BlogContainer,
  ArticleCard,
  TagCloud,
  Pagination,
  Header as BlogHeader,
  Footer as BlogFooter,
  Sidebar as BlogSidebar,
  MenuRenderer as BlogMenuRenderer,
  HeaderPillMenu,
  HeaderStackMenu,
  SidebarLinkMenu,
  SidebarArticleMenu,
  BLOG_NAV_ITEMS,
  BLOG_PATH_PATTERNS,
  BLOG_ROUTE_NAMES,
  blogRoutes,
  configureBlogRoutePatterns,
  createBlogRouter,
  createBlogRoutes,
  getArchivePath,
  getArchiveYearPath,
  getArchiveRoute,
  getArticlePath,
  getArticleRoute,
  getArticlesPath,
  getArticlesPagePath,
  getArticlesRoute,
  getBlogNavItems,
  getBlogPathPatterns,
  getCategoriesPath,
  getCategoriesRoute,
  getCategoryPath,
  getCategoryPagePath,
  getCategoryRoute,
  getHomePath,
  getHomeRoute,
  getNotFoundPath,
  getSearchPath,
  getSearchRoute,
  getTagPath,
  getTagPagePath,
  getTagRoute,
  getTagsPath,
  getTagsRoute,
  normalizeBlogRoutePatterns,
  resetBlogRoutePatterns,
  registerMenuRenderer,
  resolveMenuRenderer,
  getRegisteredMenuRenderers,
  getRegisteredMenuSources,
  createMenuItem,
  normalizeMenuConfig,
  getDefaultMenuConfig,
  getDefaultMenuPages,
  getBuiltInMenuPages,
  getPrimaryMenuPage,
  getPrimaryMenuPagePath,
  resolveHeaderMenuGroups,
  resolveMobileHeaderMenuGroups,
  resolveSidebarMenuSections,
  resolveMenuPages,
  resolveMenuPage,
  resolveMenuPageRegistry,
  getCustomMenuPages,
  getMenuPagePath,
  registerMenuSource,
  resolveMenuSource,
  menuUsesSource,
  getMaxMenuSourceLimit,
  resolveArticleId,
  resolveCategoryId,
  resolveTagId,
  useArticleStore,
  useCategoryStore,
  useTagStore,
  useConfigStore,
  useSearchStore
}

export default {
  install
}
