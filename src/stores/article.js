import { defineStore } from 'pinia'
import { getArticleList, getArticleDetail, getHotArticles, getLatestArticles, getArchiveArticles } from '../api/articles'

export const useArticleStore = defineStore('article', {
  state: () => ({
    articles: [],
    total: 0,
    currentArticle: null,
    hotArticles: [],
    latestArticles: [],
    archiveArticles: [],
    loading: false,
    error: null
  }),
  
  actions: {
    // 获取文章列表
    async fetchArticles(params = { page: 1, pageSize: 10 }) {
      this.loading = true
      try {
        const response = await getArticleList(params)
        this.articles = response.data
        this.total = response.total
        return response
      } catch (error) {
        this.error = error.message || '获取文章列表失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 获取文章详情
    async fetchArticleDetail(id) {
      this.loading = true
      try {
        const response = await getArticleDetail(id)
        this.currentArticle = response
        return response
      } catch (error) {
        this.error = error.message || '获取文章详情失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 获取热门文章
    async fetchHotArticles(limit = 5) {
      try {
        const response = await getHotArticles(limit)
        this.hotArticles = response
        return response
      } catch (error) {
        this.error = error.message || '获取热门文章失败'
        throw error
      }
    },
    
    // 获取最新文章
    async fetchLatestArticles(limit = 5) {
      try {
        const response = await getLatestArticles(limit)
        this.latestArticles = response
        return response
      } catch (error) {
        this.error = error.message || '获取最新文章失败'
        throw error
      }
    },
    
    /**
     * 获取归档文章
     * @param {number} year - 年份
     * @returns {Promise<Array>} - 返回文章数组
     */
    async fetchArchiveArticles(year) {
      try {
        const response = await getArchiveArticles(year)
        // 确保返回数组类型
        return Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('获取归档文章失败:', error)
        return []
      }
    },
    
    // 清除当前文章
    clearCurrentArticle() {
      this.currentArticle = null
    }
  }
}) 