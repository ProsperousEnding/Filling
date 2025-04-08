import { defineStore } from 'pinia'
import { searchArticles } from '../api/search'

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
    // 搜索文章
    async search(params = { keyword: '', page: 1, pageSize: 10 }) {
      this.loading = true
      this.keyword = params.keyword
      
      try {
        const response = await searchArticles(params)
        this.searchResults = response.data
        this.total = response.total
        
        // 添加到搜索历史
        if (params.keyword && !this.searchHistory.includes(params.keyword)) {
          this.searchHistory = [params.keyword, ...this.searchHistory].slice(0, 10)
          // 保存到本地存储
          localStorage.setItem('vue-blog-search-history', JSON.stringify(this.searchHistory))
        }
        
        return response
      } catch (error) {
        this.error = error.message || '搜索失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 清除搜索结果
    clearSearchResults() {
      this.searchResults = []
      this.total = 0
      this.keyword = ''
    },
    
    // 加载搜索历史
    loadSearchHistory() {
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
    
    // 清除搜索历史
    clearSearchHistory() {
      this.searchHistory = []
      localStorage.removeItem('vue-blog-search-history')
    }
  }
}) 