import { tags as tagsAPI } from './index'

/**
 * 获取标签列表
 * @returns {Promise}
 */
export function getTagList() {
  return tagsAPI.getTagList()
}

/**
 * 获取标签详情
 * @param {string} id - 标签ID
 * @returns {Promise}
 */
export function getTagDetail(id) {
  return tagsAPI.getTagDetail(id)
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
  return tagsAPI.getTagArticles(id, params)
} 