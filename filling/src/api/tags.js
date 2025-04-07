import api from './index'

/**
 * 获取标签列表
 * @returns {Promise}
 */
export function getTagList() {
  return api.get('/tags')
}

/**
 * 获取标签详情
 * @param {string} id - 标签ID
 * @returns {Promise}
 */
export function getTagDetail(id) {
  return api.get(`/tags/${id}`)
}

/**
 * 获取标签下的文章
 * @param {string} id - 标签ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise}
 */
export function getTagArticles(id, params) {
  return api.get(`/tags/${id}/articles`, { params })
}

/**
 * 获取所有标签
 * @returns {Promise}
 */
export function getAllTags() {
  return api.get('/tags')
} 