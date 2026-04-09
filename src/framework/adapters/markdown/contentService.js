import contentIndexData from '../../generated/contentIndex.generated.js'
import { resolveArticleCover } from '../../utils/articleCover.js'

const articleFileLoaders = import.meta.glob([
  '/blog/content/articles/*.md',
  '/blog/content/articles/**/*.md'
], {
  query: '?raw',
  import: 'default'
})

function safeDecodeURIComponent(input) {
  try {
    return decodeURIComponent(input)
  } catch {
    return input
  }
}

function normalizeArticleLookupId(input) {
  if (input === null || input === undefined) return ''

  return safeDecodeURIComponent(String(input))
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.md$/i, '')
}

function toSlugId(input) {
  if (!input || typeof input !== 'string') return ''
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeTextValue(input) {
  return String(input || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildAllArticles() {
  const articles = Array.isArray(contentIndexData?.articles)
    ? contentIndexData.articles.slice()
    : []

  return articles
    .map(article => ({
      ...article,
      cover: resolveArticleCover(article?.cover, article?.slug || article?.id || article?.title)
    }))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
}

function buildAllContentEntries() {
  const entries = Array.isArray(contentIndexData?.entries)
    ? contentIndexData.entries.slice()
    : []

  return entries
    .filter(entry => Boolean(String(entry?.to || '').trim()))
    .sort((a, b) => (
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      || String(a?.title || '').localeCompare(String(b?.title || ''), 'zh-CN')
    ))
}

const allArticles = buildAllArticles()
const allContentEntries = buildAllContentEntries()
const articleIndex = new Map()
const articleAliasIndex = new Map()
const articleDetailCache = new Map()

function indexArticleKey(index, key, article, override = true) {
  const normalizedKey = normalizeArticleLookupId(key)

  if (!normalizedKey) {
    return
  }

  if (override || !index.has(normalizedKey)) {
    index.set(normalizedKey, article)
  }
}

function buildArticleIndices() {
  allArticles.forEach((article) => {
    indexArticleKey(articleIndex, article.id, article)
    indexArticleKey(articleIndex, article.slug, article)

    indexArticleKey(articleAliasIndex, toSlugId(article.id), article, false)
    indexArticleKey(articleAliasIndex, toSlugId(article.slug), article, false)
    indexArticleKey(articleAliasIndex, article.title, article, false)
    indexArticleKey(articleAliasIndex, toSlugId(article.title), article, false)
  })
}

function resolveArticleRecord(id) {
  const normalizedId = normalizeArticleLookupId(id)

  if (!normalizedId) {
    return null
  }

  return articleIndex.get(normalizedId)
    || articleAliasIndex.get(normalizedId)
    || articleAliasIndex.get(toSlugId(normalizedId))
    || null
}

const categoryIndex = new Map()
const categoryEntriesIndex = new Map()
const tagIndex = new Map()
const tagEntriesIndex = new Map()
const archiveIndex = new Map()
let searchIndexPromise = null

function createCountEntity(id, name, count, description = null) {
  return {
    id,
    name,
    description,
    articleCount: count,
    count
  }
}

function buildIndices() {
  allContentEntries.forEach((entry) => {
    if (entry.category?.id) {
      const key = entry.category.id
      const existing = categoryIndex.get(key)
        || createCountEntity(entry.category.id, entry.category.name, 0)

      existing.articleCount += 1
      existing.count = existing.articleCount
      categoryIndex.set(key, existing)

      if (!categoryEntriesIndex.has(key)) {
        categoryEntriesIndex.set(key, [])
      }
      categoryEntriesIndex.get(key).push(entry)
    }

    if (Array.isArray(entry.tags)) {
      entry.tags.forEach((tag) => {
        const key = tag.id
        const existing = tagIndex.get(key)
          || createCountEntity(tag.id, tag.name, 0)

        existing.articleCount += 1
        existing.count = existing.articleCount
        tagIndex.set(key, existing)

        if (!tagEntriesIndex.has(key)) {
          tagEntriesIndex.set(key, [])
        }
        tagEntriesIndex.get(key).push(entry)
      })
    }

    const date = entry.createdAt ? new Date(entry.createdAt) : null
    const year = date ? date.getFullYear() : undefined
    if (year) {
      if (!archiveIndex.has(year)) {
        archiveIndex.set(year, [])
      }
      archiveIndex.get(year).push(entry)
    }
  })
}

buildArticleIndices()
buildIndices()

const categoryList = Array.from(categoryIndex.values())
  .sort((a, b) => b.count - a.count || String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN'))
const tagList = Array.from(tagIndex.values())
  .sort((a, b) => b.count - a.count || String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN'))
const archiveList = Array.from(archiveIndex.entries())
  .map(([year, entries]) => ({ year, count: entries.length, articles: entries }))
  .sort((a, b) => b.year - a.year)

function getScopedArticles(categoryId, tagId) {
  return allArticles.filter((article) => {
    const categoryMatched = !categoryId || article.category?.id === categoryId
    const tagMatched = !tagId || (Array.isArray(article.tags) && article.tags.some(tag => tag.id === tagId))
    return categoryMatched && tagMatched
  })
}

function aggregateCategories() {
  return categoryList
}

function aggregateTags() {
  return tagList
}

function getArchiveGroups() {
  return archiveList
}

function getArchiveArticlesByYear(year) {
  return archiveIndex.get(year) || []
}

async function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = import('../../generated/searchIndex.generated.js')
      .then(({ default: searchIndexData }) => {
        const entries = Array.isArray(searchIndexData?.entries)
          ? searchIndexData.entries
          : []

        return entries.map(entry => ({
          record: entry,
          titleHaystack: String(entry?.titleHaystack || ''),
          metaHaystack: String(entry?.metaHaystack || ''),
          contentHaystack: String(entry?.contentHaystack || '')
        }))
      })
      .catch((error) => {
        searchIndexPromise = null
        throw error
      })
  }

  return searchIndexPromise
}

async function getSearchResults(query) {
  if (!query || typeof query !== 'string') return []

  const terms = normalizeTextValue(query).toLowerCase().split(/\s+/).filter(Boolean)
  const searchIndex = await loadSearchIndex()

  return searchIndex
    .map((entry) => {
      const score = terms.reduce((sum, term) => {
        let next = sum

        if (entry.titleHaystack.includes(term)) {
          next += 5
        }
        if (entry.metaHaystack.includes(term)) {
          next += 3
        }
        if (entry.contentHaystack.includes(term)) {
          next += 1
        }

        return next
      }, 0)

      return {
        record: entry.record,
        score
      }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => (
      b.score - a.score
      || new Date(b.record.createdAt || 0) - new Date(a.record.createdAt || 0)
    ))
    .map(({ record }) => record)
}

function paginate(list, page = 1, pageSize = 10) {
  const p = Math.max(1, parseInt(page, 10))
  const s = Math.max(1, parseInt(pageSize, 10))
  const start = (p - 1) * s
  const end = start + s
  return {
    data: list.slice(start, end),
    total: list.length,
    page: p,
    pageSize: s
  }
}

async function hydrateArticleDetail(article) {
  if (!article?.sourcePath) {
    return null
  }

  if (articleDetailCache.has(article.sourcePath)) {
    return articleDetailCache.get(article.sourcePath)
  }

  const sourceLoader = articleFileLoaders[article.sourcePath]

  if (typeof sourceLoader !== 'function') {
    return null
  }

  const [{ parseArticleDetail }, rawContent] = await Promise.all([
    import('./articleSourceParser.js'),
    sourceLoader()
  ])

  const detail = {
    ...article,
    ...parseArticleDetail(rawContent, article.sourcePath)
  }

  articleDetailCache.set(article.sourcePath, detail)
  return detail
}

const contentService = {
  getArticleList(params = {}) {
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 10
    const categoryId = params.category ? toSlugId(String(params.category)) : null
    const tagId = params.tag ? toSlugId(String(params.tag)) : null

    const filtered = [...getScopedArticles(categoryId, tagId)]

    return paginate(filtered, page, pageSize)
  },

  async getArticleDetail(id) {
    const article = resolveArticleRecord(id)

    if (!article) {
      return null
    }

    return hydrateArticleDetail(article)
  },

  getLatestArticles(limit = 5) {
    return allArticles.slice(0, limit)
  },

  getRelatedArticles(id, limit = 3) {
    const current = resolveArticleRecord(id)
    if (!current) return []

    const related = allArticles.filter(article => {
      if (article.id === current.id) return false
      const sameCategory = article.category && current.category && article.category.id === current.category.id
      const sharedTag = Array.isArray(article.tags) && Array.isArray(current.tags) && article.tags.some(tag => current.tags.some(ct => ct.id === tag.id))
      return sameCategory || sharedTag
    })

    return related.slice(0, limit)
  },

  getArchiveArticles(year) {
    if (year) {
      const targetYear = parseInt(year, 10)
      return getArchiveArticlesByYear(targetYear)
    }

    return getArchiveGroups()
  },

  getCategories() {
    return aggregateCategories()
  },

  getTags() {
    return aggregateTags()
  },

  getCategoryDetail(id) {
    const categoryId = toSlugId(String(id))
    return categoryIndex.get(categoryId) || null
  },

  getCategoryArticles(id, params = { page: 1, pageSize: 10 }) {
    const categoryId = toSlugId(String(id))
    const filtered = categoryEntriesIndex.get(categoryId) || []
    return paginate(filtered, params.page, params.pageSize)
  },

  getTagDetail(id) {
    const tagId = toSlugId(String(id))
    return tagIndex.get(tagId) || null
  },

  getTagArticles(id, params = { page: 1, pageSize: 10 }) {
    const tagId = toSlugId(String(id))
    const filtered = tagEntriesIndex.get(tagId) || []
    return paginate(filtered, params.page, params.pageSize)
  },

  async searchArticles(params = {}) {
    if (typeof params === 'string') {
      return getSearchResults(params)
    }

    const keyword = typeof params.keyword === 'string' ? params.keyword : ''
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 10
    const matches = await getSearchResults(keyword)

    return paginate(matches, page, pageSize)
  }
}

export default contentService
