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
  getMenuConfigDiagnostics,
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
  getSidebarLayoutDiagnostics,
  getSidebarMenuLayoutDiagnostics,
  normalizeSidebarLayout,
  resolveSidebarComponents
} from './utils/sidebarLayout'
import {
  BLOG_PATH_PATTERNS,
  BLOG_ROUTE_NAMES,
  configureBlogRoutePatterns,
  createBlogHistory,
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
import {
  configureContentAdapter,
  getContentAdapter,
  resetContentAdapter
} from './adapters/contentAdapter'
import {
  configureConfigProvider,
  resetConfigProvider
} from './config/configProvider'
import {
  BLOG_RUNTIME_CONTEXT_KEY,
  createBlogRuntimeContext,
  installBlogRuntimeContext,
  normalizeBlogBaseUrl,
  useBlogBaseUrl,
  useBlogRuntimeContext
} from './runtime/runtimeContext'

import './style.css'

const BLOG_READY_KEY = Symbol('vue-blog-ready')

const install = (app, options = {}) => {
  const {
    contentAdapter,
    configProvider,
    base,
    baseUrl,
    config,
    ...legacyConfig
  } = options && typeof options === 'object' ? options : {}

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

  installBlogRuntimeContext(app, pinia, {
    contentAdapter,
    configProvider,
    baseUrl: baseUrl ?? base
  })

  const configStore = useConfigStore(pinia)
  const configInput = config && typeof config === 'object'
    ? config
    : legacyConfig
  let ready

  if (Object.keys(configInput).length > 0) {
    configStore.initConfig(configInput)
    ready = Promise.resolve(configStore)
  } else if (configProvider) {
    ready = configStore.bootstrapConfig().then(() => configStore)
  } else {
    ready = Promise.resolve(configStore)
  }

  app.config.globalProperties.$blogReady = ready
  app.provide(BLOG_READY_KEY, ready)
}

function getBlogReady(app) {
  return app?.config?.globalProperties?.$blogReady || Promise.resolve(null)
}

async function setupBlogFramework(app, options = {}) {
  install(app, options)
  const configStore = await getBlogReady(app)

  return {
    configStore,
    pinia: app.config.globalProperties.$pinia
  }
}

export {
  install,
  BLOG_READY_KEY,
  getBlogReady,
  setupBlogFramework,
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
  BLOG_PATH_PATTERNS,
  BLOG_ROUTE_NAMES,
  configureBlogRoutePatterns,
  createBlogHistory,
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
  getMenuConfigDiagnostics,
  getSidebarLayoutDiagnostics,
  getSidebarMenuLayoutDiagnostics,
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
  normalizeSidebarLayout,
  resolveSidebarComponents,
  resolveArticleId,
  resolveCategoryId,
  resolveTagId,
  useArticleStore,
  useCategoryStore,
  useTagStore,
  useConfigStore,
  useSearchStore,
  configureContentAdapter,
  getContentAdapter,
  resetContentAdapter,
  configureConfigProvider,
  resetConfigProvider,
  BLOG_RUNTIME_CONTEXT_KEY,
  createBlogRuntimeContext,
  installBlogRuntimeContext,
  normalizeBlogBaseUrl,
  useBlogBaseUrl,
  useBlogRuntimeContext
}

export default {
  install
}
