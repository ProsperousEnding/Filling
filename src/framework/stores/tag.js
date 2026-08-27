import { defineStore } from 'pinia'

import { getStoreContentAdapter } from '../runtime/runtimeContext.js'

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

function mapResponse(response, transform) {
  return response && typeof response.then === 'function'
    ? response.then(transform)
    : transform(response)
}

export const useTagStore = defineStore('tag', {
  actions: {
    fetchTags() {
      return mapResponse(
        getStoreContentAdapter(this).getTags(),
        response => (Array.isArray(response) ? response : []).map(normalizeTag)
      )
    },

    fetchTagDetail(id) {
      return mapResponse(
        getStoreContentAdapter(this).getTagDetail(id),
        normalizeTag
      )
    },

    fetchTagArticles(id, params = { page: 1, pageSize: 10 }) {
      return getStoreContentAdapter(this).getTagArticles(id, params)
    }
  }
})
