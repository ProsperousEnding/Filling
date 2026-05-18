import { createRouter, createWebHistory } from 'vue-router'
import {
  BLOG_ROUTE_NAMES,
  getBlogPathPatterns,
  normalizeBlogRoutePatterns
} from './routeManifest.js'
import { resolveMenuPageComponentKey } from '../utils/pageComponentConfig.js'
import { getCustomMenuPages, resolveMenuPageRegistry } from '../utils/menuConfig.js'

const Home = () => import('../views/Home.vue')
const ArticlesView = () => import('../views/ArticlesView.vue')
const ArticleDetail = () => import('../views/ArticleDetail.vue')
const CategoryView = () => import('../views/CategoryView.vue')
const TagView = () => import('../views/TagView.vue')
const CategoriesView = () => import('../views/CategoriesView.vue')
const TagsView = () => import('../views/TagsView.vue')
const ArchiveView = () => import('../views/ArchiveView.vue')
const SearchView = () => import('../views/SearchView.vue')
const MenuPageView = () => import('../views/MenuPageView.vue')
const MenuPageItemView = () => import('../views/MenuPageItemView.vue')

export function createBlogRoutes(routePatterns = getBlogPathPatterns(), menuConfig = {}) {
  const pageRegistry = resolveMenuPageRegistry(menuConfig, routePatterns)
  const customMenuPages = getCustomMenuPages(menuConfig, routePatterns)
  const homePage = pageRegistry.home
  const articlesPage = pageRegistry.articles
  const categoriesPage = pageRegistry.categories
  const tagsPage = pageRegistry.tags
  const archivePage = pageRegistry.archive
  const searchPage = pageRegistry.search
  const routes = []

  if (homePage) {
    routes.push({
      path: routePatterns.home,
      name: BLOG_ROUTE_NAMES.home,
      component: Home,
      meta: {
        title: homePage.title || '首页'
      }
    })
  }

  if (articlesPage) {
    routes.push({
      path: routePatterns.articles,
      name: BLOG_ROUTE_NAMES.articles,
      component: ArticlesView,
      meta: {
        title: articlesPage.title || '文章列表'
      }
    })
    routes.push({
      path: routePatterns.articlesPage,
      name: BLOG_ROUTE_NAMES.articlesPage,
      component: ArticlesView,
      meta: {
        title: articlesPage.title || '文章列表'
      }
    })
  }

  routes.push({
      path: routePatterns.articleDetail,
      name: BLOG_ROUTE_NAMES.articleDetail,
      component: ArticleDetail,
      meta: {
        title: '文章详情'
      }
    })

  if (categoriesPage) {
    routes.push({
      path: routePatterns.categories,
      name: BLOG_ROUTE_NAMES.categories,
      component: CategoriesView,
      meta: {
        title: categoriesPage.title || '分类'
      }
    })
    routes.push({
      path: routePatterns.categoryPage,
      name: BLOG_ROUTE_NAMES.categoryPage,
      component: CategoryView,
      meta: {
        title: categoriesPage.title || '分类'
      }
    })
    routes.push({
      path: routePatterns.categoryDetail,
      name: BLOG_ROUTE_NAMES.categoryDetail,
      component: CategoryView,
      meta: {
        title: categoriesPage.title || '分类'
      }
    })
  }

  if (tagsPage) {
    routes.push({
      path: routePatterns.tags,
      name: BLOG_ROUTE_NAMES.tags,
      component: TagsView,
      meta: {
        title: tagsPage.title || '标签'
      }
    })
    routes.push({
      path: routePatterns.tagPage,
      name: BLOG_ROUTE_NAMES.tagPage,
      component: TagView,
      meta: {
        title: tagsPage.title || '标签'
      }
    })
    routes.push({
      path: routePatterns.tagDetail,
      name: BLOG_ROUTE_NAMES.tagDetail,
      component: TagView,
      meta: {
        title: tagsPage.title || '标签'
      }
    })
  }

  if (archivePage) {
    routes.push({
      path: routePatterns.archive,
      name: BLOG_ROUTE_NAMES.archive,
      component: ArchiveView,
      meta: {
        title: archivePage.title || '归档'
      }
    })
    routes.push({
      path: routePatterns.archiveYear,
      name: BLOG_ROUTE_NAMES.archiveYear,
      component: ArchiveView,
      meta: {
        title: archivePage.title || '归档'
      }
    })
  }

  if (searchPage) {
    routes.push({
      path: routePatterns.search,
      name: BLOG_ROUTE_NAMES.search,
      component: SearchView,
      meta: {
        title: searchPage.title || '搜索'
      }
    })
  }

  routes.push(
    ...customMenuPages.map(page => ({
      path: page.path,
      name: `MenuPage:${page.key}`,
      component: MenuPageView,
      meta: {
        title: page.title,
        menuPageKey: page.key
      }
    })),
    ...customMenuPages
      .filter((page) => {
        const componentKey = resolveMenuPageComponentKey(page.component)

        return (
          !page.builtIn
          && componentKey !== 'context'
          && componentKey !== 'friends'
          && componentKey !== 'guestbook'
          && componentKey !== 'sponsor'
          && String(page.folder || '').trim()
        )
      })
      .map(page => ({
        path: `${page.path}/:itemId`,
        name: `MenuPageItem:${page.key}`,
        component: MenuPageItemView,
        meta: {
          title: page.title,
          menuPageKey: page.key
        }
    }))
  )

  return routes
}

export const blogRoutes = createBlogRoutes()

export function createBlogRouter(options = {}) {
  const {
    history = createWebHistory(import.meta.env.BASE_URL),
    routes,
    routePatterns,
    menuConfig = {},
    titleSuffix = ''
  } = options

  const resolvedRoutePatterns = routePatterns
    ? normalizeBlogRoutePatterns(routePatterns)
    : getBlogPathPatterns()
  const resolvedRoutes = Array.isArray(routes) ? routes : createBlogRoutes(resolvedRoutePatterns, menuConfig)
  const router = createRouter({
    history,
    routes: resolvedRoutes
  })

  router.beforeEach((to, from, next) => {
    if (typeof document !== 'undefined') {
      document.title = [to.meta.title, titleSuffix].filter(Boolean).join(' - ')
    }
    next()
  })

  return router
}

export default createBlogRouter

export * from './routeManifest.js'
