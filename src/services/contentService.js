import fm from 'front-matter'
import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

const articleFiles = import.meta.glob('/docs/articles/*.md', {
  eager: true,
  as: 'raw'
})

const VIEW_STORAGE_KEY = 'filling:article-runtime-views'
const VIEW_TOUCH_STORAGE_KEY = 'filling:article-view-touch'
const VIEW_DEDUP_MS = 30 * 60 * 1000

const baseViewCountMap = new Map()
const runtimeViewCounts = readStorageObject(VIEW_STORAGE_KEY)
const runtimeViewTouch = readStorageObject(VIEW_TOUCH_STORAGE_KEY)

function toSlugId(input) {
  if (!input || typeof input !== 'string') return ''
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function safeParseObject(raw) {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    return {}
  }
  return {}
}

function readStorageObject(key) {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    return safeParseObject(window.localStorage.getItem(key))
  } catch {
    return {}
  }
}

function writeStorageObject(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value || {}))
  } catch {
    // Ignore storage quota/security errors.
  }
}

function getRuntimeViewCount(articleId) {
  const value = Number(runtimeViewCounts[articleId])
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

function getBaseViewCount(articleId) {
  const value = Number(baseViewCountMap.get(articleId))
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

function syncArticleViewCount(article) {
  if (!article) return article
  article.views = getBaseViewCount(article.id) + getRuntimeViewCount(article.id)
  return article
}

function normalizeArticle([path, rawContent]) {
  const fileName = path.split('/').pop().replace('.md', '')
  const parsed = fm(rawContent || '')
  const frontmatter = parsed.attributes || {}
  const html = markdown.render(parsed.body || '')
  const title = frontmatter.title || fileName

  const categoryName = frontmatter.category || null
  const category = categoryName
    ? { id: toSlugId(String(categoryName)), name: String(categoryName) }
    : null

  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.map(tag => ({ id: toSlugId(String(tag)), name: String(tag) }))
    : []

  const baseViews = Number.isFinite(Number(frontmatter.views)) && Number(frontmatter.views) >= 0
    ? Math.floor(Number(frontmatter.views))
    : 0

  baseViewCountMap.set(fileName, baseViews)

  return {
    id: fileName,
    slug: fileName,
    title,
    date: frontmatter.date || null,
    author: frontmatter.author ? { name: String(frontmatter.author) } : null,
    category,
    tags,
    cover: frontmatter.cover || null,
    description: frontmatter.description || '',
    summary: frontmatter.summary || frontmatter.description || '',
    content: html,
    createdAt: frontmatter.date || null,
    views: baseViews + getRuntimeViewCount(fileName)
  }
}

function buildAllArticles() {
  const articles = Object.entries(articleFiles).map(normalizeArticle)
  return articles.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
}

const allArticles = buildAllArticles()

function syncAllArticleViews() {
  allArticles.forEach(syncArticleViewCount)
}

function aggregateCategories() {
  const map = new Map()
  allArticles.forEach(article => {
    if (article.category) {
      const key = article.category.id
      const existing = map.get(key) || {
        id: article.category.id,
        name: article.category.name,
        description: null,
        articleCount: 0
      }
      existing.articleCount += 1
      map.set(key, existing)
    }
  })
  return Array.from(map.values())
}

function aggregateTags() {
  const map = new Map()
  allArticles.forEach(article => {
    if (Array.isArray(article.tags)) {
      article.tags.forEach(tag => {
        const key = tag.id
        const existing = map.get(key) || {
          id: tag.id,
          name: tag.name,
          description: null,
          articleCount: 0
        }
        existing.articleCount += 1
        map.set(key, existing)
      })
    }
  })
  return Array.from(map.values())
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

const contentService = {
  getArticleList(params = {}) {
    syncAllArticleViews()

    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 10
    const categoryId = params.category ? toSlugId(String(params.category)) : null
    const tagId = params.tag ? toSlugId(String(params.tag)) : null

    let filtered = [...allArticles]
    if (categoryId) {
      filtered = filtered.filter(article => article.category && article.category.id === categoryId)
    }
    if (tagId) {
      filtered = filtered.filter(article => Array.isArray(article.tags) && article.tags.some(tag => tag.id === tagId))
    }

    return paginate(filtered, page, pageSize)
  },

  getArticleDetail(id) {
    const article = allArticles.find(item => item.id === String(id) || item.slug === String(id)) || null
    if (!article) return null
    return syncArticleViewCount(article)
  },

  recordArticleView(id) {
    const article = this.getArticleDetail(id)
    if (!article) return null

    if (typeof window === 'undefined') {
      return article
    }

    const key = article.id
    const now = Date.now()
    const lastViewAt = Number(runtimeViewTouch[key])

    if (Number.isFinite(lastViewAt) && now - lastViewAt < VIEW_DEDUP_MS) {
      return article
    }

    runtimeViewTouch[key] = now
    runtimeViewCounts[key] = getRuntimeViewCount(key) + 1

    writeStorageObject(VIEW_TOUCH_STORAGE_KEY, runtimeViewTouch)
    writeStorageObject(VIEW_STORAGE_KEY, runtimeViewCounts)

    return syncArticleViewCount(article)
  },

  getHotArticles(limit = 5) {
    syncAllArticleViews()
    return [...allArticles].sort((a, b) => b.views - a.views).slice(0, limit)
  },

  getLatestArticles(limit = 5) {
    syncAllArticleViews()
    return allArticles.slice(0, limit)
  },

  getRelatedArticles(id, limit = 3) {
    syncAllArticleViews()
    const current = this.getArticleDetail(id)
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
    syncAllArticleViews()

    const groups = new Map()
    allArticles.forEach(article => {
      const date = article.date ? new Date(article.date) : null
      const groupYear = date ? date.getFullYear() : undefined
      if (!groupYear) return
      if (!groups.has(groupYear)) groups.set(groupYear, [])
      groups.get(groupYear).push(article)
    })

    if (year) {
      const targetYear = parseInt(year, 10)
      return groups.get(targetYear) || []
    }

    return Array.from(groups.entries())
      .map(([groupYear, articles]) => ({ year: groupYear, count: articles.length, articles }))
      .sort((a, b) => b.year - a.year)
  },

  getCategories() {
    return aggregateCategories()
  },

  getTags() {
    return aggregateTags()
  },

  getCategoryDetail(id) {
    const categoryId = toSlugId(String(id))
    return aggregateCategories().find(category => category.id === categoryId) || null
  },

  getCategoryArticles(id, params = { page: 1, pageSize: 10 }) {
    syncAllArticleViews()
    const categoryId = toSlugId(String(id))
    const filtered = allArticles.filter(article => article.category && article.category.id === categoryId)
    return paginate(filtered, params.page, params.pageSize)
  },

  getTagDetail(id) {
    const tagId = toSlugId(String(id))
    return aggregateTags().find(tag => tag.id === tagId) || null
  },

  getTagArticles(id, params = { page: 1, pageSize: 10 }) {
    syncAllArticleViews()
    const tagId = toSlugId(String(id))
    const filtered = allArticles.filter(article => Array.isArray(article.tags) && article.tags.some(tag => tag.id === tagId))
    return paginate(filtered, params.page, params.pageSize)
  },

  searchArticles(query) {
    syncAllArticleViews()
    if (!query || typeof query !== 'string') return []

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    return allArticles.filter(article => {
      const title = (article.title || '').toLowerCase()
      const content = (article.content || '').toLowerCase()
      const description = (article.description || '').toLowerCase()
      const summary = (article.summary || '').toLowerCase()
      return terms.some(term =>
        title.includes(term) ||
        content.includes(term) ||
        description.includes(term) ||
        summary.includes(term)
      )
    })
  }
}

export default contentService
