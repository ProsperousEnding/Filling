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
    async fetchArticles(params = { page: 1, pageSize: 10 }) {
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

    async fetchLatestArticles(limit = 5) {
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

    async fetchArchiveGroups() {
      try {
        const response = contentService.getArchiveArticles()
        return Array.isArray(response) ? response : []
      } catch (error) {
        console.error('获取归档年份失败:', error)
        return []
      }
    },

    async fetchArchiveArticles(year) {
      try {
        const response = contentService.getArchiveArticles(year)
        return Array.isArray(response) ? response : []
      } catch (error) {
        console.error('获取归档文章失败:', error)
        return []
      }
    },

    async fetchRelatedArticles(id, limit = 3) {
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
