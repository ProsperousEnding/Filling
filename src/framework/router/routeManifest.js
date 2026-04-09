export const BLOG_ROUTE_NAMES = Object.freeze({
  home: 'Home',
  articles: 'Articles',
  articlesPage: 'ArticlesPage',
  articleDetail: 'ArticleDetail',
  categories: 'Categories',
  categoryDetail: 'Category',
  categoryPage: 'CategoryPage',
  tags: 'Tags',
  tagDetail: 'Tag',
  tagPage: 'TagPage',
  archive: 'Archive',
  archiveYear: 'ArchiveYear',
  search: 'Search'
})

export const BLOG_PATH_PATTERNS = Object.freeze({
  home: '/',
  articles: '/articles',
  articlesPage: '/articles/page/:page',
  articleDetail: '/article/:id',
  categories: '/category',
  categoryDetail: '/category/:id',
  categoryPage: '/category/:id/page/:page',
  tags: '/tag',
  tagDetail: '/tag/:id',
  tagPage: '/tag/:id/page/:page',
  archive: '/archive',
  archiveYear: '/archive/:year',
  search: '/search',
  notFound: '/404'
})

const DEFAULT_BLOG_NAV_ITEMS = Object.freeze([
  Object.freeze({ key: 'home', name: '首页', route: 'home' }),
  Object.freeze({ key: 'articles', name: '文章', route: 'articles' }),
  Object.freeze({ key: 'categories', name: '分类', route: 'categories' }),
  Object.freeze({ key: 'tags', name: '标签', route: 'tags' }),
  Object.freeze({ key: 'archive', name: '归档', route: 'archive' })
])

const ROUTE_PATTERN_ALIASES = Object.freeze({
  home: ['home'],
  articles: ['articles'],
  articlesPage: ['articlesPage', 'articles_page'],
  articleDetail: ['articleDetail', 'article'],
  categories: ['categories'],
  categoryDetail: ['categoryDetail', 'category'],
  categoryPage: ['categoryPage', 'category_page'],
  tags: ['tags'],
  tagDetail: ['tagDetail', 'tag'],
  tagPage: ['tagPage', 'tag_page'],
  archive: ['archive'],
  archiveYear: ['archiveYear', 'archive_year'],
  search: ['search'],
  notFound: ['notFound', 'not_found']
})

let currentBlogPathPatterns = { ...BLOG_PATH_PATTERNS }

function normalizeString(value) {
  return String(value ?? '').trim()
}

function normalizePositiveInteger(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizePathPattern(value, fallback, { requiredParams = [] } = {}) {
  const normalizedValue = normalizeString(value)

  if (!normalizedValue) {
    return fallback
  }

  const withLeadingSlash = normalizedValue.startsWith('/') ? normalizedValue : `/${normalizedValue}`
  const withoutTrailingSlash = withLeadingSlash === '/'
    ? withLeadingSlash
    : withLeadingSlash.replace(/\/+$/, '')

  if (requiredParams.some(param => !withoutTrailingSlash.includes(`:${param}`))) {
    return fallback
  }

  return withoutTrailingSlash || fallback
}

function pickPatternInput(source, key) {
  const aliases = ROUTE_PATTERN_ALIASES[key] || [key]

  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(source, alias)) {
      return source[alias]
    }
  }

  return undefined
}

function resolveLookupId(input, preferredKeys = ['id']) {
  if (typeof input === 'string' || typeof input === 'number') {
    return normalizeString(input)
  }

  if (!input || typeof input !== 'object') {
    return ''
  }

  for (const key of preferredKeys) {
    const resolvedValue = normalizeString(input[key])

    if (resolvedValue) {
      return resolvedValue
    }
  }

  return ''
}

function replacePathParam(pattern, paramName, value) {
  const normalizedValue = normalizeString(value)

  if (!normalizedValue) {
    return ''
  }

  return pattern.replace(`:${paramName}`, encodeURIComponent(normalizedValue))
}

function replacePathParams(pattern, params = {}) {
  return Object.entries(params).reduce((nextPattern, [paramName, value]) => (
    replacePathParam(nextPattern, paramName, value)
  ), pattern)
}

function createNamedRoute(name, params = null, query = null) {
  const route = { name }

  if (params && Object.keys(params).length > 0) {
    route.params = params
  }

  if (query && Object.keys(query).length > 0) {
    route.query = query
  }

  return route
}

function resolveRoutePatternsInput(routePatterns = {}) {
  return routePatterns && typeof routePatterns === 'object' ? routePatterns : {}
}

function normalizeRoutePage(page) {
  return normalizePositiveInteger(page)
}

function isFirstPage(page) {
  return normalizeRoutePage(page) <= 1
}

export function normalizeBlogRoutePatterns(routePatterns = {}) {
  const source = resolveRoutePatternsInput(routePatterns)

  return {
    home: normalizePathPattern(pickPatternInput(source, 'home'), BLOG_PATH_PATTERNS.home),
    articles: normalizePathPattern(pickPatternInput(source, 'articles'), BLOG_PATH_PATTERNS.articles),
    articlesPage: normalizePathPattern(
      pickPatternInput(source, 'articlesPage'),
      BLOG_PATH_PATTERNS.articlesPage,
      { requiredParams: ['page'] }
    ),
    articleDetail: normalizePathPattern(
      pickPatternInput(source, 'articleDetail'),
      BLOG_PATH_PATTERNS.articleDetail,
      { requiredParams: ['id'] }
    ),
    categories: normalizePathPattern(pickPatternInput(source, 'categories'), BLOG_PATH_PATTERNS.categories),
    categoryDetail: normalizePathPattern(
      pickPatternInput(source, 'categoryDetail'),
      BLOG_PATH_PATTERNS.categoryDetail,
      { requiredParams: ['id'] }
    ),
    categoryPage: normalizePathPattern(
      pickPatternInput(source, 'categoryPage'),
      BLOG_PATH_PATTERNS.categoryPage,
      { requiredParams: ['id', 'page'] }
    ),
    tags: normalizePathPattern(pickPatternInput(source, 'tags'), BLOG_PATH_PATTERNS.tags),
    tagDetail: normalizePathPattern(
      pickPatternInput(source, 'tagDetail'),
      BLOG_PATH_PATTERNS.tagDetail,
      { requiredParams: ['id'] }
    ),
    tagPage: normalizePathPattern(
      pickPatternInput(source, 'tagPage'),
      BLOG_PATH_PATTERNS.tagPage,
      { requiredParams: ['id', 'page'] }
    ),
    archive: normalizePathPattern(pickPatternInput(source, 'archive'), BLOG_PATH_PATTERNS.archive),
    archiveYear: normalizePathPattern(
      pickPatternInput(source, 'archiveYear'),
      BLOG_PATH_PATTERNS.archiveYear,
      { requiredParams: ['year'] }
    ),
    search: normalizePathPattern(pickPatternInput(source, 'search'), BLOG_PATH_PATTERNS.search),
    notFound: normalizePathPattern(pickPatternInput(source, 'notFound'), BLOG_PATH_PATTERNS.notFound)
  }
}

export function configureBlogRoutePatterns(routePatterns = {}) {
  currentBlogPathPatterns = normalizeBlogRoutePatterns(routePatterns)
  return currentBlogPathPatterns
}

export function getBlogPathPatterns() {
  return { ...currentBlogPathPatterns }
}

export function resetBlogRoutePatterns() {
  currentBlogPathPatterns = normalizeBlogRoutePatterns(BLOG_PATH_PATTERNS)
  return getBlogPathPatterns()
}

export function getBlogNavItems(routePatterns = currentBlogPathPatterns) {
  return DEFAULT_BLOG_NAV_ITEMS
    .map(item => ({
      key: item.key,
      name: item.name,
      path: routePatterns[item.route]
    }))
    .filter(item => normalizeString(item.path))
}

export const BLOG_NAV_ITEMS = Object.freeze(
  getBlogNavItems(normalizeBlogRoutePatterns(BLOG_PATH_PATTERNS))
)

export function resolveArticleId(articleOrId) {
  return resolveLookupId(articleOrId, ['slug', 'id'])
}

export function resolveCategoryId(categoryOrId) {
  return resolveLookupId(categoryOrId, ['id', 'slug', 'name'])
}

export function resolveTagId(tagOrId) {
  return resolveLookupId(tagOrId, ['id', 'slug', 'name'])
}

export function getHomePath(routePatterns = currentBlogPathPatterns) {
  return routePatterns.home
}

export function getArticlesPath(routePatterns = currentBlogPathPatterns) {
  return routePatterns.articles
}

export function getArticlesPagePath(page = 1, routePatterns = currentBlogPathPatterns) {
  const normalizedPage = normalizeRoutePage(page)

  return isFirstPage(normalizedPage)
    ? getArticlesPath(routePatterns)
    : replacePathParam(routePatterns.articlesPage, 'page', normalizedPage)
}

export function getArticlePath(articleOrId, routePatterns = currentBlogPathPatterns) {
  const articleId = resolveArticleId(articleOrId)

  return articleId
    ? replacePathParam(routePatterns.articleDetail, 'id', articleId)
    : getArticlesPath(routePatterns)
}

export function getCategoriesPath(routePatterns = currentBlogPathPatterns) {
  return routePatterns.categories
}

export function getCategoryPath(categoryOrId, routePatterns = currentBlogPathPatterns) {
  const categoryId = resolveCategoryId(categoryOrId)

  return categoryId
    ? replacePathParam(routePatterns.categoryDetail, 'id', categoryId)
    : getCategoriesPath(routePatterns)
}

export function getCategoryPagePath(categoryOrId, page = 1, routePatterns = currentBlogPathPatterns) {
  const categoryId = resolveCategoryId(categoryOrId)
  const normalizedPage = normalizeRoutePage(page)

  if (!categoryId) {
    return getCategoriesPath(routePatterns)
  }

  return isFirstPage(normalizedPage)
    ? getCategoryPath(categoryId, routePatterns)
    : replacePathParams(routePatterns.categoryPage, {
      id: categoryId,
      page: normalizedPage
    })
}

export function getTagsPath(routePatterns = currentBlogPathPatterns) {
  return routePatterns.tags
}

export function getTagPath(tagOrId, routePatterns = currentBlogPathPatterns) {
  const tagId = resolveTagId(tagOrId)

  return tagId
    ? replacePathParam(routePatterns.tagDetail, 'id', tagId)
    : getTagsPath(routePatterns)
}

export function getTagPagePath(tagOrId, page = 1, routePatterns = currentBlogPathPatterns) {
  const tagId = resolveTagId(tagOrId)
  const normalizedPage = normalizeRoutePage(page)

  if (!tagId) {
    return getTagsPath(routePatterns)
  }

  return isFirstPage(normalizedPage)
    ? getTagPath(tagId, routePatterns)
    : replacePathParams(routePatterns.tagPage, {
      id: tagId,
      page: normalizedPage
    })
}

export function getArchivePath(routePatterns = currentBlogPathPatterns) {
  return routePatterns.archive
}

export function getArchiveYearPath(year, routePatterns = currentBlogPathPatterns) {
  const normalizedYear = normalizePositiveInteger(year, 0)

  return normalizedYear > 0
    ? replacePathParam(routePatterns.archiveYear, 'year', normalizedYear)
    : getArchivePath(routePatterns)
}

export function getSearchPath(routePatterns = currentBlogPathPatterns) {
  return routePatterns.search
}

export function getNotFoundPath(routePatterns = currentBlogPathPatterns) {
  return routePatterns.notFound
}

export function getHomeRoute() {
  return createNamedRoute(BLOG_ROUTE_NAMES.home)
}

export function getArticlesRoute(page = 1) {
  const normalizedPage = normalizeRoutePage(page)

  return isFirstPage(normalizedPage)
    ? createNamedRoute(BLOG_ROUTE_NAMES.articles)
    : createNamedRoute(BLOG_ROUTE_NAMES.articlesPage, { page: normalizedPage })
}

export function getArticleRoute(articleOrId) {
  const articleId = resolveArticleId(articleOrId)

  return articleId
    ? createNamedRoute(BLOG_ROUTE_NAMES.articleDetail, { id: articleId })
    : getArticlesRoute()
}

export function getCategoriesRoute() {
  return createNamedRoute(BLOG_ROUTE_NAMES.categories)
}

export function getCategoryRoute(categoryOrId, page = 1) {
  const categoryId = resolveCategoryId(categoryOrId)
  const normalizedPage = normalizeRoutePage(page)

  if (!categoryId) {
    return getCategoriesRoute()
  }

  return isFirstPage(normalizedPage)
    ? createNamedRoute(BLOG_ROUTE_NAMES.categoryDetail, { id: categoryId })
    : createNamedRoute(BLOG_ROUTE_NAMES.categoryPage, {
      id: categoryId,
      page: normalizedPage
    })
}

export function getTagsRoute() {
  return createNamedRoute(BLOG_ROUTE_NAMES.tags)
}

export function getTagRoute(tagOrId, page = 1) {
  const tagId = resolveTagId(tagOrId)
  const normalizedPage = normalizeRoutePage(page)

  if (!tagId) {
    return getTagsRoute()
  }

  return isFirstPage(normalizedPage)
    ? createNamedRoute(BLOG_ROUTE_NAMES.tagDetail, { id: tagId })
    : createNamedRoute(BLOG_ROUTE_NAMES.tagPage, {
      id: tagId,
      page: normalizedPage
    })
}

export function getArchiveRoute(year) {
  const normalizedYear = normalizePositiveInteger(year, 0)

  return normalizedYear > 0
    ? createNamedRoute(BLOG_ROUTE_NAMES.archiveYear, { year: normalizedYear })
    : createNamedRoute(BLOG_ROUTE_NAMES.archive)
}

export function getSearchRoute(options = {}) {
  const normalizedOptions = typeof options === 'string'
    ? { keyword: options }
    : (options && typeof options === 'object' ? options : {})
  const keyword = normalizeString(normalizedOptions.keyword ?? normalizedOptions.q)
  const query = {}

  if (keyword) {
    query.keyword = keyword
  }

  if (normalizedOptions.page !== undefined && normalizedOptions.page !== null) {
    query.page = normalizePositiveInteger(normalizedOptions.page)
  }

  return createNamedRoute(BLOG_ROUTE_NAMES.search, null, query)
}
