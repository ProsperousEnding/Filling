import api from './index'

/**
 * 搜索文章
 * @param {Object} params - 搜索参数
 * @param {string} params.keyword - 搜索关键词
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise}
 */
export function searchArticles(params) {
  return api.get('/search', { params })
} 