import { defineStore } from 'pinia'
import contentService from '../adapters/markdown/contentService'

function normalizeTag(entity) {
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
    async fetchTags() {
      this.loading = true
      this.error = null

      try {
        const response = contentService.getTags()
        const list = (Array.isArray(response) ? response : []).map(normalizeTag)
        this.tags = list
        return list
      } catch (error) {
        this.error = error.message || '获取标签列表失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTagDetail(id) {
      this.loading = true
      this.error = null

      try {
        const response = contentService.getTagDetail(id)
        const tag = normalizeTag(response)
        this.currentTag = tag
        return tag
      } catch (error) {
        this.error = error.message || '获取标签详情失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTagArticles(id, params = { page: 1, pageSize: 10 }) {
      this.loading = true
      this.error = null

      try {
        const response = contentService.getTagArticles(id, params)
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

    clearCurrentTag() {
      this.currentTag = null
      this.tagArticles = []
      this.totalArticles = 0
    }
  }
})
