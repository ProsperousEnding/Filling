import api from './index'

/**
 * 获取文章评论列表
 * @param {string} articleId - 文章ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise}
 */
export function getArticleComments(articleId, params) {
  return api.get(`/articles/${articleId}/comments`, { params })
}

/**
 * 添加评论
 * @param {string} articleId - 文章ID
 * @param {Object} data - 评论数据
 * @param {string} data.content - 评论内容
 * @param {string} data.author - 评论作者
 * @param {string} data.email - 评论作者邮箱
 * @returns {Promise}
 */
export function addComment(articleId, data) {
  return api.post(`/articles/${articleId}/comments`, data)
}

/**
 * 回复评论
 * @param {string} articleId - 文章ID
 * @param {string} commentId - 评论ID
 * @param {Object} data - 回复数据
 * @param {string} data.content - 回复内容
 * @param {string} data.author - 回复作者
 * @param {string} data.email - 回复作者邮箱
 * @returns {Promise}
 */
export function replyComment(articleId, commentId, data) {
  return api.post(`/articles/${articleId}/comments/${commentId}/replies`, data)
} 