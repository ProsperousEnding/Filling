// 使用import.meta.glob自动导入所有Markdown文件
const articleFiles = import.meta.glob('/src/content/articles/*.md', { eager: true })

// 处理所有文章数据
const processArticles = () => {
  const articles = []
  
  Object.entries(articleFiles).forEach(([path, module]) => {
    const fileName = path.split('/').pop().replace('.md', '')
    
    articles.push({
      id: fileName,
      slug: fileName,
      title: module.frontmatter.title,
      date: module.frontmatter.date,
      author: module.frontmatter.author ? 
        { name: module.frontmatter.author } : null,
      category: module.frontmatter.category ? 
        { id: module.frontmatter.category.toLowerCase().replace(/\s+/g, '-'), 
          name: module.frontmatter.category } : null,
      tags: (module.frontmatter.tags || []).map(tag => ({
        id: tag.toLowerCase().replace(/\s+/g, '-'),
        name: tag
      })),
      cover: module.frontmatter.cover,
      description: module.frontmatter.description,
      content: module.html,
      createdAt: module.frontmatter.date,
      views: module.frontmatter.views || 0
    })
  })
  
  // 按日期排序（降序）
  return articles.sort((a, b) => new Date(b.date) - new Date(a.date))
}

const allArticles = processArticles()

// 获取分类列表
const getCategories = () => {
  const categories = {}
  
  allArticles.forEach(article => {
    if (article.category) {
      categories[article.category.name] = categories[article.category.name] || { 
        name: article.category.name, 
        id: article.category.id,
        count: 0 
      }
      categories[article.category.name].count++
    }
  })
  
  return Object.values(categories)
}

// 获取标签列表
const getTags = () => {
  const tags = {}
  
  allArticles.forEach(article => {
    if (article.tags && Array.isArray(article.tags)) {
      article.tags.forEach(tag => {
        tags[tag.name] = tags[tag.name] || { 
          name: tag.name, 
          id: tag.id,
          count: 0 
        }
        tags[tag.name].count++
      })
    }
  })
  
  return Object.values(tags)
}

// 获取归档数据
const getArchives = () => {
  const archives = {}
  
  allArticles.forEach(article => {
    const date = new Date(article.date)
    const year = date.getFullYear()
    
    if (!archives[year]) {
      archives[year] = []
    }
    
    archives[year].push(article)
  })
  
  return Object.entries(archives)
    .map(([year, articles]) => ({
      year: parseInt(year),
      count: articles.length,
      articles
    }))
    .sort((a, b) => b.year - a.year)
}

export default {
  // 获取文章列表（支持分页和筛选）
  getArticleList(params = {}) {
    const { page = 1, pageSize = 10, category, tag } = params
    
    let filteredArticles = [...allArticles]
    
    if (category) {
      filteredArticles = filteredArticles.filter(article => 
        article.category && article.category.id === category)
    }
    
    if (tag) {
      filteredArticles = filteredArticles.filter(article => 
        article.tags && article.tags.some(t => t.id === tag))
    }
    
    // 计算分页
    const total = filteredArticles.length
    const start = (page - 1) * pageSize
    const end = start + parseInt(pageSize)
    const data = filteredArticles.slice(start, end)
    
    return { data, total, page, pageSize }
  },
  
  // 获取文章详情
  getArticleDetail(id) {
    return allArticles.find(article => article.id === id || article.slug === id)
  },
  
  // 获取热门文章
  getHotArticles(limit = 5) {
    // 按浏览量排序
    return [...allArticles]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
  },
  
  // 获取最新文章
  getLatestArticles(limit = 5) {
    return allArticles.slice(0, limit)
  },
  
  // 获取相关文章
  getRelatedArticles(id, limit = 3) {
    const currentArticle = this.getArticleDetail(id)
    if (!currentArticle) return []
    
    // 基于相同标签或分类查找相关文章
    const related = allArticles.filter(article => 
      article.id !== currentArticle.id && (
        (article.category && currentArticle.category && 
         article.category.id === currentArticle.category.id) ||
        (article.tags && currentArticle.tags && 
         article.tags.some(tag => 
           currentArticle.tags.some(t => t.id === tag.id)
         ))
      )
    )
    
    return related.slice(0, limit)
  },
  
  // 获取归档文章
  getArchiveArticles(year) {
    const archives = getArchives()
    
    if (year) {
      const yearData = archives.find(a => a.year === parseInt(year))
      return yearData ? yearData.articles : []
    }
    
    return archives
  },
  
  // 获取分类列表
  getCategories() {
    return getCategories()
  },
  
  // 获取标签列表
  getTags() {
    return getTags()
  },
  
  // 搜索文章
  searchArticles(query) {
    if (!query || typeof query !== 'string') {
      return []
    }
    
    const searchTerms = query.toLowerCase().split(/\s+/)
    
    return allArticles.filter(article => {
      const title = (article.title || '').toLowerCase()
      const content = (article.content || '').toLowerCase()
      const description = (article.description || '').toLowerCase()
      
      return searchTerms.some(term => 
        title.includes(term) || 
        content.includes(term) || 
        description.includes(term)
      )
    })
  }
}
