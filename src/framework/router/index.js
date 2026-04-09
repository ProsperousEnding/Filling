import { createRouter, createWebHistory } from 'vue-router'
import {
  BLOG_ROUTE_NAMES,
  getBlogPathPatterns,
  normalizeBlogRoutePatterns
} from './routeManifest.js'
import { getCustomMenuPages } from '../utils/menuConfig.js'

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
  const customMenuPages = getCustomMenuPages(menuConfig, routePatterns)

  return [
    {
      path: routePatterns.home,
      name: BLOG_ROUTE_NAMES.home,
      component: Home,
      meta: {
        title: '首页'
      }
    },
    {
      path: routePatterns.articles,
      name: BLOG_ROUTE_NAMES.articles,
      component: ArticlesView,
      meta: {
        title: '文章列表'
      }
    },
    {
      path: routePatterns.articlesPage,
      name: BLOG_ROUTE_NAMES.articlesPage,
      component: ArticlesView,
      meta: {
        title: '文章列表'
      }
    },
    {
      path: routePatterns.articleDetail,
      name: BLOG_ROUTE_NAMES.articleDetail,
      component: ArticleDetail,
      meta: {
        title: '文章详情'
      }
    },
    {
      path: routePatterns.categories,
      name: BLOG_ROUTE_NAMES.categories,
      component: CategoriesView
    },
    {
      path: routePatterns.categoryPage,
      name: BLOG_ROUTE_NAMES.categoryPage,
      component: CategoryView,
      meta: {
        title: '分类'
      }
    },
    {
      path: routePatterns.categoryDetail,
      name: BLOG_ROUTE_NAMES.categoryDetail,
      component: CategoryView,
      meta: {
        title: '分类'
      }
    },
    {
      path: routePatterns.tags,
      name: BLOG_ROUTE_NAMES.tags,
      component: TagsView
    },
    {
      path: routePatterns.tagPage,
      name: BLOG_ROUTE_NAMES.tagPage,
      component: TagView,
      meta: {
        title: '标签'
      }
    },
    {
      path: routePatterns.tagDetail,
      name: BLOG_ROUTE_NAMES.tagDetail,
      component: TagView,
      meta: {
        title: '标签'
      }
    },
    {
      path: routePatterns.archive,
      name: BLOG_ROUTE_NAMES.archive,
      component: ArchiveView,
      meta: {
        title: '归档'
      }
    },
    {
      path: routePatterns.archiveYear,
      name: BLOG_ROUTE_NAMES.archiveYear,
      component: ArchiveView,
      meta: {
        title: '归档'
      }
    },
    {
      path: routePatterns.search,
      name: BLOG_ROUTE_NAMES.search,
      component: SearchView,
      meta: {
        title: '搜索'
      }
    },
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
      .filter(page => !page.builtIn && String(page.folder || '').trim())
      .map(page => ({
        path: `${page.path}/:itemId`,
        name: `MenuPageItem:${page.key}`,
        component: MenuPageItemView,
        meta: {
          title: page.title,
          menuPageKey: page.key
        }
    }))
  ]
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
