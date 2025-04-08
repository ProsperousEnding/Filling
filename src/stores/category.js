import { defineStore } from 'pinia'
import { getCategoryList, getCategoryDetail, getCategoryArticles, getAllCategories } from '../api/categories'
import api from '../api'

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
        this.categories = response
        return response
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
    },

    /**
     * 获取所有分类
     * @returns {Promise<Array>} - 返回分类数组
     */
    async fetchAllCategories() {
      try {
        const response = await getAllCategories()
        // 确保返回数组类型
        return Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('获取所有分类失败:', error)
        return []
      }
    }
  }
}) 