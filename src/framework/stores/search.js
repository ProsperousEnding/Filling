import { defineStore } from 'pinia'
import contentService from '../adapters/markdown/contentService'

export const useSearchStore = defineStore('search', {
  state: () => ({
    searchResults: [],
    total: 0,
    keyword: '',
    loading: false,
    error: null,
    searchHistory: []
  }),

  actions: {
    async search(params = { keyword: '', page: 1, pageSize: 10 }) {
      this.loading = true
      this.error = null
      this.keyword = params.keyword

      try {
        const response = await contentService.searchArticles(params)
        this.searchResults = Array.isArray(response?.data) ? response.data : []
        this.total = Number(response?.total) || 0

        if (typeof window !== 'undefined' && params.keyword && !this.searchHistory.includes(params.keyword)) {
          this.searchHistory = [params.keyword, ...this.searchHistory].slice(0, 10)
          localStorage.setItem('vue-blog-search-history', JSON.stringify(this.searchHistory))
        }

        return {
          data: this.searchResults,
          total: this.total,
          page: Number(response?.page) || params.page || 1,
          pageSize: Number(response?.pageSize) || params.pageSize || 10
        }
      } catch (error) {
        this.error = error.message || '搜索失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    clearSearchResults() {
      this.searchResults = []
      this.total = 0
      this.keyword = ''
    },

    loadSearchHistory() {
      if (typeof window === 'undefined') return
      const history = localStorage.getItem('vue-blog-search-history')
      if (history) {
        try {
          this.searchHistory = JSON.parse(history)
        } catch (error) {
          console.error('Failed to parse search history:', error)
          this.searchHistory = []
        }
      }
    },

    clearSearchHistory() {
      this.searchHistory = []
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vue-blog-search-history')
      }
    }
  }
})
