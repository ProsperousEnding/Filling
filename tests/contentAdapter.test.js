import assert from 'node:assert/strict'
import test from 'node:test'

import contentAdapter, {
  configureContentAdapter,
  getContentAdapter,
  resetContentAdapter
} from '../src/framework/adapters/contentAdapter.js'
import {
  configureConfigProvider,
  loadConfiguredConfigs,
  resetConfigProvider
} from '../src/framework/config/configProvider.js'

test.afterEach(() => {
  resetContentAdapter()
  resetConfigProvider()
})

test('content adapter forwards calls with the adapter as context', () => {
  const adapter = {
    prefix: 'article',
    getArticleDetail(id) {
      return `${this.prefix}:${id}`
    }
  }

  configureContentAdapter(adapter)

  assert.equal(getContentAdapter(), adapter)
  assert.equal(contentAdapter.getArticleDetail('hello'), 'article:hello')
})

test('content adapter fails clearly when a method is not configured', () => {
  assert.throws(
    () => contentAdapter.getArticleList(),
    /Content adapter is not configured.*getArticleList/
  )
})

test('config provider accepts functions and provider objects', async () => {
  configureConfigProvider(async () => ({ site: { title: 'Function' } }))
  assert.equal((await loadConfiguredConfigs()).site.title, 'Function')

  configureConfigProvider({
    title: 'Object',
    async loadAllConfigs() {
      return { site: { title: this.title } }
    }
  })
  assert.equal((await loadConfiguredConfigs()).site.title, 'Object')
})
