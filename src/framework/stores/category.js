import { defineStore } from 'pinia'
import contentService from '../adapters/markdown/contentService'

function normalizeCategory(entity) {
  if (!entity || typeof entity !== 'object') {
    return entity
  }

  const count = Number(entity.count ?? entity.articleCount ?? 0)

  return {
    ...entity,
    count,
    articleCount: count
  }
}

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [],
    currentCategory: null,
    categoryArticles: [],
    totalArticles: 0,
    loading: false,
    error: null
  }),

  actions: {
    async fetchCategories() {
      this.loading = true
      this.error = null

      try {
        const response = contentService.getCategories()
        const list = (Array.isArray(response) ? response : []).map(normalizeCategory)
        this.categories = list
        return list
      } catch (error) {
        this.error = error.message || '获取分类列表失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchCategoryDetail(id) {
      this.loading = true
      this.error = null

      try {
        const response = contentService.getCategoryDetail(id)
        const category = normalizeCategory(response)
        this.currentCategory = category
        return category
      } catch (error) {
        this.error = error.message || '获取分类详情失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchCategoryArticles(id, params = { page: 1, pageSize: 10 }) {
      this.loading = true
      this.error = null

      try {
        const response = contentService.getCategoryArticles(id, params)
        this.categoryArticles = response.data
        this.totalArticles = response.total
        return response
      } catch (error) {
        this.error = error.message || '获取分类文章失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    clearCurrentCategory() {
      this.currentCategory = null
      this.categoryArticles = []
      this.totalArticles = 0
    }
  }
})
