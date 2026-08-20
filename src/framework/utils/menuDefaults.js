import { BUILT_IN_PAGE_DEFAULT_COMPONENTS } from './pageComponentConfig.js'

export const DEFAULT_MENU_CONFIG = Object.freeze({
  header: Object.freeze([
    Object.freeze({
      key: 'primary',
      renderer: 'header-pill',
      source: 'blog-nav',
      primaryLimit: 5,
      overflowLabel: '更多',
      items: []
    })
  ]),
  mobileHeader: Object.freeze([
    Object.freeze({
      key: 'primary-mobile',
      renderer: 'header-stack',
      source: 'blog-nav',
      items: []
    })
  ]),
  sidebar: Object.freeze([
    Object.freeze({
      key: 'categories',
      title: '分类',
      renderer: 'sidebar-link',
      source: 'categories',
      variant: 'default',
      showCount: true,
      limit: 8,
      items: []
    }),
    Object.freeze({
      key: 'tags',
      title: '标签',
      renderer: 'sidebar-link',
      source: 'tags',
      variant: 'tags',
      showCount: true,
      limit: 12,
      items: []
    }),
    Object.freeze({
      key: 'latest-articles',
      title: '最新文章',
      renderer: 'sidebar-article',
      source: 'latest-articles',
      variant: 'default',
      showCount: false,
      limit: 5,
      items: []
    })
  ]),
  links: Object.freeze([]),
  pages: Object.freeze([])
})

export const DEFAULT_MENU_RENDERER_NAMES = Object.freeze([
  'header-pill',
  'header-stack',
  'sidebar-link',
  'sidebar-article'
])

export const DEFAULT_MENU_PAGES = Object.freeze([
  Object.freeze({
    key: 'home',
    label: '首页',
    title: '最新文章',
    description: '浏览站点最新发布的文章内容。',
    component: BUILT_IN_PAGE_DEFAULT_COMPONENTS.home,
    menuGroup: 'auto',
    menuOrder: 10,
    visible: true
  }),
  Object.freeze({
    key: 'articles',
    label: '文章',
    title: '所有文章',
    description: '浏览站点全部文章列表。',
    component: BUILT_IN_PAGE_DEFAULT_COMPONENTS.articles,
    menuGroup: 'auto',
    menuOrder: 20,
    visible: true
  }),
  Object.freeze({
    key: 'categories',
    label: '分类',
    title: '文章分类',
    description: '浏览站点所有文章分类。',
    component: BUILT_IN_PAGE_DEFAULT_COMPONENTS.categories,
    menuGroup: 'auto',
    menuOrder: 30,
    visible: true
  }),
  Object.freeze({
    key: 'tags',
    label: '标签',
    title: '文章标签',
    description: '浏览站点所有文章标签。',
    component: BUILT_IN_PAGE_DEFAULT_COMPONENTS.tags,
    menuGroup: 'auto',
    menuOrder: 40,
    visible: true
  }),
  Object.freeze({
    key: 'archive',
    label: '归档',
    title: '文章归档',
    description: '按年份浏览站点归档文章。',
    component: BUILT_IN_PAGE_DEFAULT_COMPONENTS.archive,
    menuGroup: 'auto',
    menuOrder: 50,
    visible: true
  }),
  Object.freeze({
    key: 'search',
    label: '搜索',
    title: '搜索',
    description: '搜索站点文章内容。',
    component: '',
    menuGroup: 'auto',
    menuOrder: 60,
    visible: false
  })
])

export const BUILT_IN_MENU_PAGE_KEYS = new Set(DEFAULT_MENU_PAGES.map(page => page.key))

export const MENU_SOURCE_ALIASES = Object.freeze({
  blogNav: 'blog-nav',
  blog_nav: 'blog-nav',
  categories: 'categories',
  tags: 'tags',
  latestArticles: 'latest-articles',
  latest_articles: 'latest-articles',
  friendLinks: 'friend-links',
  friend_links: 'friend-links',
  custom: 'custom'
})

export const MENU_GROUPS = new Set(['auto', 'primary', 'more'])
