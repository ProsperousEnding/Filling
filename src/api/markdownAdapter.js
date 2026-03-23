import contentService from '../services/contentService'

// 替代原有API，使用Markdown内容服务
export const articles = {
  getArticleList: (params) => Promise.resolve(contentService.getArticleList(params)),
  getArticleDetail: (id) => Promise.resolve(contentService.getArticleDetail(id)),
  getHotArticles: (limit) => Promise.resolve(contentService.getHotArticles(limit)),
  getLatestArticles: (limit) => Promise.resolve(contentService.getLatestArticles(limit)),
  getRelatedArticles: (id, limit) => Promise.resolve(contentService.getRelatedArticles(id, limit)),
  getArchiveArticles: (year) => Promise.resolve({ data: contentService.getArchiveArticles(year) }),
  recordArticleView: (id) => Promise.resolve(contentService.recordArticleView(id))
}

export const categories = {
  getCategoryList: () => Promise.resolve(contentService.getCategories()),
  getCategoryDetail: (id) => Promise.resolve(contentService.getCategoryDetail(id)),
  getCategoryArticles: (id, params) => Promise.resolve(contentService.getCategoryArticles(id, params))
}

export const tags = {
  getTagList: () => Promise.resolve(contentService.getTags()),
  getTagDetail: (id) => Promise.resolve(contentService.getTagDetail(id)),
  getTagArticles: (id, params) => Promise.resolve(contentService.getTagArticles(id, params))
}

export const search = {
  searchArticles: (params) => {
    const keyword = typeof params === 'string' ? params : (params?.keyword || '')
    const page = params?.page ? parseInt(params.page) : 1
    const pageSize = params?.pageSize ? parseInt(params.pageSize) : 10

    const all = contentService.searchArticles(keyword) || []
    const total = all.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const data = all.slice(start, end)

    return Promise.resolve({ data, total, page, pageSize })
  }
}
