import api from './index'

/**
 * 获取分类列表
 * @returns {Promise}
 */
export function getCategoryList() {
  return api.get('/categories')
}

/**
 * 获取分类详情
 * @param {string} id - 分类ID
 * @returns {Promise}
 */
export function getCategoryDetail(id) {
  return api.get(`/categories/${id}`)
}

/**
 * 获取分类下的文章
 * @param {string} id - 分类ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise}
 */
export function getCategoryArticles(id, params) {
  return api.get(`/categories/${id}/articles`, { params })
}

/**
 * 获取所有分类
 * @returns {Promise}
 */
export function getAllCategories() {
  return api.get('/categories')
} 