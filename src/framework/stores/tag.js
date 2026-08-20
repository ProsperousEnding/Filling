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

export const useTagStore = defineStore('tag', {
  actions: {
    async fetchTags() {
      const response = await getStoreContentAdapter(this).getTags()
      return (Array.isArray(response) ? response : []).map(normalizeTag)
    },

    async fetchTagDetail(id) {
      return normalizeTag(await getStoreContentAdapter(this).getTagDetail(id))
    },

    async fetchTagArticles(id, params = { page: 1, pageSize: 10 }) {
      return getStoreContentAdapter(this).getTagArticles(id, params)
    }
  }
})
