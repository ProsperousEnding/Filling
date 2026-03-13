import { defineStore } from 'pinia'
import { getCategoryList, getCategoryDetail, getCategoryArticles } from '../api/categories'

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
    // 获取分类列表
    async fetchCategories() {
      this.loading = true
      try {
        const response = await getCategoryList()
        const list = Array.isArray(response) ? response : (response?.data || [])
        this.categories = list
        return list
      } catch (error) {
        this.error = error.message || '获取分类列表失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 获取分类详情
    async fetchCategoryDetail(id) {
      this.loading = true
      try {
        const response = await getCategoryDetail(id)
        this.currentCategory = response
        return response
      } catch (error) {
        this.error = error.message || '获取分类详情失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 获取分类下的文章
    async fetchCategoryArticles(id, params = { page: 1, pageSize: 10 }) {
      this.loading = true
      try {
        const response = await getCategoryArticles(id, params)
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
    
    // 清除当前分类
    clearCurrentCategory() {
      this.currentCategory = null
      this.categoryArticles = []
      this.totalArticles = 0
    }
  }
}) 