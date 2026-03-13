import fm from 'front-matter'
import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 以原始文本形式导入所有 Markdown 文章
const articleFiles = import.meta.glob('/docs/articles/*.md', {
  eager: true,
  as: 'raw'
})

function toSlugId(input) {
  if (!input || typeof input !== 'string') return ''
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
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
    views: typeof frontmatter.views === 'number' ? frontmatter.views : 0
  }
}

function buildAllArticles() {
  const articles = Object.entries(articleFiles).map(normalizeArticle)
  // 按日期降序
  return articles.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
}

const allArticles = buildAllArticles()

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
  const p = Math.max(1, parseInt(page))
  const s = Math.max(1, parseInt(pageSize))
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
  // 列表（支持分类/标签筛选）
  getArticleList(params = {}) {
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

  // 详情
  getArticleDetail(id) {
    return allArticles.find(article => article.id === String(id) || article.slug === String(id)) || null
  },

  // 热门
  getHotArticles(limit = 5) {
    return [...allArticles].sort((a, b) => b.views - a.views).slice(0, limit)
  },

  // 最新
  getLatestArticles(limit = 5) {
    return allArticles.slice(0, limit)
  },

  // 相关文章
  getRelatedArticles(id, limit = 3) {
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

  // 归档
  getArchiveArticles(year) {
    const groups = new Map()
    allArticles.forEach(article => {
      const date = article.date ? new Date(article.date) : null
      const groupYear = date ? date.getFullYear() : undefined
      if (!groupYear) return
      if (!groups.has(groupYear)) groups.set(groupYear, [])
      groups.get(groupYear).push(article)
    })

    if (year) {
      const targetYear = parseInt(year)
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
    const categoryId = toSlugId(String(id))
    const filtered = allArticles.filter(article => article.category && article.category.id === categoryId)
    return paginate(filtered, params.page, params.pageSize)
  },

  getTagDetail(id) {
    const tagId = toSlugId(String(id))
    return aggregateTags().find(tag => tag.id === tagId) || null
  },
  getTagArticles(id, params = { page: 1, pageSize: 10 }) {
    const tagId = toSlugId(String(id))
    const filtered = allArticles.filter(article => Array.isArray(article.tags) && article.tags.some(tag => tag.id === tagId))
    return paginate(filtered, params.page, params.pageSize)
  },

  searchArticles(query) {
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
