import { defineStore } from 'pinia'

import { getStoreContentAdapter } from '../runtime/runtimeContext.js'

export const useSearchStore = defineStore('search', {
  actions: {
    async search(params = { keyword: '', page: 1, pageSize: 10 }) {
      return getStoreContentAdapter(this).searchArticles(params)
    }
  }
})
