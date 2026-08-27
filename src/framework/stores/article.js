import { defineStore } from 'pinia'

import { getStoreContentAdapter } from '../runtime/runtimeContext.js'

export const useArticleStore = defineStore('article', {
  actions: {
    fetchArticles(params = { page: 1, pageSize: 10 }) {
      return getStoreContentAdapter(this).getArticleList(params)
    },

    fetchHomeArticles(params = { page: 1, pageSize: 8, config: {} }) {
      return getStoreContentAdapter(this).getHomeArticleList(params)
    },

    fetchArticleDetail(id) {
      return getStoreContentAdapter(this).getArticleDetail(id)
    },

    fetchLatestArticles(limit = 5) {
      return getStoreContentAdapter(this).getLatestArticles(limit)
    },

    fetchArchiveGroups() {
      return getStoreContentAdapter(this).getArchiveArticles()
    },

    fetchArchiveArticles(year) {
      return getStoreContentAdapter(this).getArchiveArticles(year)
    },

    fetchRelatedArticles(id, limit = 3) {
      return getStoreContentAdapter(this).getRelatedArticles(id, limit)
    }
  }
})
