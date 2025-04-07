import { createRouter, createWebHistory } from 'vue-router'

// 懒加载路由组件
const Home = () => import('../views/Home.vue')
const ArticleList = () => import('../views/ArticleList.vue')
const ArticleDetail = () => import('../views/ArticleDetail.vue')
const CategoryView = () => import('../views/CategoryView.vue')
const TagView = () => import('../views/TagView.vue')
const ArchiveView = () => import('../views/ArchiveView.vue')
const SearchView = () => import('../views/SearchView.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页'
    }
  },
  {
    path: '/articles',
    name: 'Articles',
    component: ArticleList,
    meta: {
      title: '文章列表'
    }
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: ArticleDetail,
    meta: {
      title: '文章详情'
    }
  },
  {
    path: '/category',
    name: 'CategoryList',
    component: () => import('../views/CategoryListView.vue')
  },
  {
    path: '/category/:id',
    name: 'Category',
    component: CategoryView,
    meta: {
      title: '分类'
    }
  },
  {
    path: '/tag',
    name: 'TagList',
    component: () => import('../views/TagListView.vue')
  },
  {
    path: '/tag/:id',
    name: 'Tag',
    component: TagView,
    meta: {
      title: '标签'
    }
  },
  {
    path: '/archive',
    name: 'Archive',
    component: ArchiveView,
    meta: {
      title: '归档'
    }
  },
  {
    path: '/search',
    name: 'Search',
    component: SearchView,
    meta: {
      title: '搜索'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - Vue博客框架` : 'Vue博客框架'
  next()
})

export default router 