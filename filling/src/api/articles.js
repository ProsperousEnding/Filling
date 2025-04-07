import api from './index'

/**
 * 获取文章列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @param {string} params.category - 分类ID
 * @param {string} params.tag - 标签ID
 * @returns {Promise}
 */
export function getArticleList(params) {
  return api.get('/articles', { params })
}

/**
 * 获取文章详情
 * @param {string} id - 文章ID
 * @returns {Promise}
 */
export function getArticleDetail(id) {
  return api.get(`/articles/${id}`)
}

/**
 * 获取热门文章
 * @param {number} limit - 获取数量
 * @returns {Promise}
 */
export function getHotArticles(limit = 5) {
  return api.get('/articles/hot', { params: { limit } })
}

/**
 * 获取最新文章
 * @param {number} limit - 获取数量 
 * @returns {Promise}
 */
export function getLatestArticles(limit = 5) {
  return api.get('/articles/latest', { params: { limit } })
}

/**
 * 获取相关文章
 * @param {string} id - 当前文章ID
 * @param {number} limit - 获取数量
 * @returns {Promise}
 */
export function getRelatedArticles(id, limit = 3) {
  return api.get(`/articles/${id}/related`, { params: { limit } })
}

/**
 * 获取归档文章列表
 * @param {number} year - 年份，可选
 * @returns {Promise}
 */
export function getArchiveArticles(year) {
  return api.get('/articles/archive', { params: { year } })
} 