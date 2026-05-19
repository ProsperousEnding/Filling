import { defineStore } from 'pinia'
import contentService from '../adapters/markdown/contentService'

export const useArticleStore = defineStore('article', {
  state: () => ({
    articles: [],
    total: 0,
    currentArticle: null,
    latestArticles: [],
    loading: false,
    error: null
  }),

  actions: {
    fetchArticles(params = { page: 1, pageSize: 10 }) {
      this.loading = true
      this.error = null

      try {
        const response = contentService.getArticleList(params)
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

    fetchHomeArticles(params = { page: 1, pageSize: 8, config: {} }) {
      this.loading = true
      this.error = null

      try {
        const response = contentService.getHomeArticleList(params)
        this.articles = response.data
        this.total = response.total
        return response
      } catch (error) {
        this.error = error.message || '获取首页文章列表失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchArticleDetail(id) {
      this.loading = true
      this.error = null

      try {
        const response = await contentService.getArticleDetail(id)
        this.currentArticle = response
        return response
      } catch (error) {
        this.error = error.message || '获取文章详情失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    fetchLatestArticles(limit = 5) {
      this.error = null

      try {
        const response = contentService.getLatestArticles(limit)
        this.latestArticles = response
        return response
      } catch (error) {
        this.error = error.message || '获取最新文章失败'
        throw error
      }
    },

    fetchArchiveGroups() {
      try {
        const response = contentService.getArchiveArticles()
        return Array.isArray(response) ? response : []
      } catch (error) {
        console.error('获取归档年份失败:', error)
        return []
      }
    },

    fetchArchiveArticles(year) {
      try {
        const response = contentService.getArchiveArticles(year)
        return Array.isArray(response) ? response : []
      } catch (error) {
        console.error('获取归档文章失败:', error)
        return []
      }
    },

    fetchRelatedArticles(id, limit = 3) {
      try {
        const response = contentService.getRelatedArticles(id, limit)
        return Array.isArray(response) ? response : []
      } catch (error) {
        console.error('获取相关文章失败:', error)
        return []
      }
    },

    clearCurrentArticle() {
      this.currentArticle = null
    }
  }
})
