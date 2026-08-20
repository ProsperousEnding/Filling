import assert from 'node:assert/strict'
import test from 'node:test'

import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'

import { createBlogHistory } from '../src/framework/router/index.js'
import { BLOG_PATH_PATTERNS, getBlogPathPatterns } from '../src/framework/router/routeManifest.js'
import { installBlogRuntimeContext, normalizeBlogBaseUrl } from '../src/framework/runtime/runtimeContext.js'
import { useArticleStore } from '../src/framework/stores/article.js'

function createRuntime(options) {
  const app = createSSRApp({})
  const pinia = createPinia()
  installBlogRuntimeContext(app, pinia, options)
  app.use(pinia)
  return { app, pinia }
}

test('content adapters remain isolated between Pinia instances', async () => {
  const runtimeA = createRuntime({
    contentAdapter: {
      getArticleList: () => ({ data: [{ id: 'a' }], total: 1 })
    }
  })
  const runtimeB = createRuntime({
    contentAdapter: {
      getArticleList: () => ({ data: [{ id: 'b' }], total: 1 })
    }
  })
  const articleStoreA = useArticleStore(runtimeA.pinia)
  const articleStoreB = useArticleStore(runtimeB.pinia)
  assert.equal((await articleStoreA.fetchArticles()).data[0].id, 'a')
  assert.equal((await articleStoreB.fetchArticles()).data[0].id, 'b')
  assert.equal(getBlogPathPatterns().articles, BLOG_PATH_PATTERNS.articles)
})

test('router base paths are explicit and normalized by the runtime context', () => {
  assert.equal(normalizeBlogBaseUrl('docs/blog'), '/docs/blog/')
  assert.equal(normalizeBlogBaseUrl('/'), '/')
  assert.equal(
    createBlogHistory('/docs/blog/', base => ({ base })).base,
    '/docs/blog/'
  )
})
