import { defineStore } from 'pinia'

import { getStoreContentAdapter } from '../runtime/runtimeContext.js'

export const useArticleStore = defineStore('article', {
  actions: {
    async fetchArticles(params = { page: 1, pageSize: 10 }) {
      return getStoreContentAdapter(this).getArticleList(params)
    },

    async fetchHomeArticles(params = { page: 1, pageSize: 8, config: {} }) {
      return getStoreContentAdapter(this).getHomeArticleList(params)
    },

    async fetchArticleDetail(id) {
      return getStoreContentAdapter(this).getArticleDetail(id)
    },

    async fetchLatestArticles(limit = 5) {
      return getStoreContentAdapter(this).getLatestArticles(limit)
    },

    async fetchArchiveGroups() {
      return getStoreContentAdapter(this).getArchiveArticles()
    },

    async fetchArchiveArticles(year) {
      return getStoreContentAdapter(this).getArchiveArticles(year)
    },

    async fetchRelatedArticles(id, limit = 3) {
      return getStoreContentAdapter(this).getRelatedArticles(id, limit)
    }
  }
})
