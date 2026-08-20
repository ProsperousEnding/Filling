import { defineStore } from 'pinia'

import { getStoreContentAdapter } from '../runtime/runtimeContext.js'

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
  actions: {
    async fetchCategories() {
      const response = await getStoreContentAdapter(this).getCategories()
      return (Array.isArray(response) ? response : []).map(normalizeCategory)
    },

    async fetchCategoryDetail(id) {
      return normalizeCategory(await getStoreContentAdapter(this).getCategoryDetail(id))
    },

    async fetchCategoryArticles(id, params = { page: 1, pageSize: 10 }) {
      return getStoreContentAdapter(this).getCategoryArticles(id, params)
    }
  }
})
