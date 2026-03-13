import { defineStore } from 'pinia'
import { getTagList, getTagDetail, getTagArticles } from '../api/tags'

export const useTagStore = defineStore('tag', {
  state: () => ({
    tags: [],
    currentTag: null,
    tagArticles: [],
    totalArticles: 0,
    loading: false,
    error: null
  }),
  
  actions: {
    // 获取标签列表
    async fetchTags() {
      this.loading = true
      try {
        const response = await getTagList()
        const list = Array.isArray(response) ? response : (response?.data || [])
        this.tags = list
        return list
      } catch (error) {
        this.error = error.message || '获取标签列表失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 获取标签详情
    async fetchTagDetail(id) {
      this.loading = true
      try {
        const response = await getTagDetail(id)
        this.currentTag = response
        return response
      } catch (error) {
        this.error = error.message || '获取标签详情失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 获取标签下的文章
    async fetchTagArticles(id, params = { page: 1, pageSize: 10 }) {
      this.loading = true
      try {
        const response = await getTagArticles(id, params)
        this.tagArticles = response.data
        this.totalArticles = response.total
        return response
      } catch (error) {
        this.error = error.message || '获取标签文章失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 清除当前标签
    clearCurrentTag() {
      this.currentTag = null
      this.tagArticles = []
      this.totalArticles = 0
    }
  }
}) 