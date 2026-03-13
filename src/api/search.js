import { search as mdSearch } from './markdownAdapter'

/**
 * 搜索文章（本地 Markdown 适配器）
 * @param {Object} params - 搜索参数
 * @param {string} params.keyword - 搜索关键词
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise<{data: any[], total: number, page: number, pageSize: number}>}
 */
export function searchArticles(params) {
  return mdSearch.searchArticles(params)
} 