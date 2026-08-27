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

function mapResponse(response, transform) {
  return response && typeof response.then === 'function'
    ? response.then(transform)
    : transform(response)
}

export const useCategoryStore = defineStore('category', {
  actions: {
    fetchCategories() {
      return mapResponse(
        getStoreContentAdapter(this).getCategories(),
        response => (Array.isArray(response) ? response : []).map(normalizeCategory)
      )
    },

    fetchCategoryDetail(id) {
      return mapResponse(
        getStoreContentAdapter(this).getCategoryDetail(id),
        normalizeCategory
      )
    },

    fetchCategoryArticles(id, params = { page: 1, pageSize: 10 }) {
      return getStoreContentAdapter(this).getCategoryArticles(id, params)
    }
  }
})
