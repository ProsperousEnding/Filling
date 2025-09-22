import contentService from '../service/contentService'

// 替代原有API，使用Markdown内容服务
export const articles = {
  getArticleList: (params) => {
    return Promise.resolve(contentService.getArticleList(params))
  },
  
  getArticleDetail: (id) => {
    const article = contentService.getArticleDetail(id)
    return Promise.resolve(article)
  },
  
  getHotArticles: (limit) => {
    return Promise.resolve(contentService.getHotArticles(limit))
  },
  
  getLatestArticles: (limit) => {
    return Promise.resolve(contentService.getLatestArticles(limit))
  },
  
  getRelatedArticles: (id, limit) => {
    return Promise.resolve(contentService.getRelatedArticles(id, limit))
  },
  
  getArchiveArticles: (year) => {
    const result = contentService.getArchiveArticles(year)
    return Promise.resolve({ data: result })
  }
}

export const categories = {
  getCategoryList: () => {
    return Promise.resolve(contentService.getCategories())
  }
}

export const tags = {
  getTagList: () => {
    return Promise.resolve(contentService.getTags())
  }
}

export const search = {
  searchArticles: (query) => {
    return Promise.resolve(contentService.searchArticles(query))
  }
}

// 保留原API接口形式
export default {
  setBaseUrl: () => {} // 空方法，本地Markdown不需要设置URL
}
