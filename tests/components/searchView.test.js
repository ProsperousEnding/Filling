import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { BLOG_ROUTE_NAMES } from '../../src/framework/router/routeManifest.js'
import SearchView from '../../src/framework/views/SearchView.vue'

let wrapper

function createDeferred() {
  let resolve
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

async function mountSearchView({
  searchArticles,
  latestArticles = [],
  tags = [],
  initialUrl = '/search'
} = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{
      path: '/search',
      name: BLOG_ROUTE_NAMES.search,
      component: { template: '<div />' }
    }]
  })
  const pinia = createPinia()
  const contentAdapter = {
    getTags: () => tags,
    getLatestArticles: () => latestArticles,
    searchArticles: searchArticles || (() => ({ data: [], total: 0 }))
  }

  pinia.use(() => ({
    $blogRuntime: {
      baseUrl: '/',
      contentAdapter
    }
  }))

  await router.push(initialUrl)
  await router.isReady()

  wrapper = mount(SearchView, {
    attachTo: document.body,
    global: {
      plugins: [pinia, router],
      stubs: {
        SearchResultCard: {
          props: ['article'],
          template: '<div class="search-result-stub">{{ article.title }}</div>'
        },
        TagCloud: {
          props: ['title', 'tags'],
          template: '<div class="tag-cloud-stub">{{ title }}:{{ tags.length }}</div>'
        },
        Pagination: true
      }
    }
  })
  await flushPromises()

  return { router, wrapper }
}

async function advanceRealtimeSearch() {
  await vi.advanceTimersByTimeAsync(250)
  await flushPromises()
  await nextTick()
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
})

describe('SearchView realtime search', () => {
  it('shows recent content and popular tags before a search', async () => {
    const { wrapper: searchView } = await mountSearchView({
      latestArticles: [{ id: 'latest', title: 'Latest article' }],
      tags: [{ id: 'vue', name: 'Vue', count: 3 }]
    })

    expect(searchView.get('#search-latest-title').text()).toBe('最新内容')
    expect(searchView.get('.search-result-stub').text()).toBe('Latest article')
    expect(searchView.get('.tag-cloud-stub').text()).toBe('热门标签:1')
  })

  it('searches after the input debounce without a button click', async () => {
    vi.useFakeTimers()
    const searchArticles = vi.fn(({ keyword }) => ({
      data: [{ id: keyword, title: keyword }],
      total: 1
    }))
    const { router, wrapper: searchView } = await mountSearchView({ searchArticles })
    const input = searchView.get('.search-input')

    await input.setValue('Vue')
    await vi.advanceTimersByTimeAsync(249)
    expect(searchArticles).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()
    await nextTick()

    expect(router.currentRoute.value.query.keyword).toBe('Vue')
    expect(searchArticles).toHaveBeenCalledTimes(1)
    expect(searchArticles).toHaveBeenCalledWith({ keyword: 'Vue', page: 1, pageSize: 10 })
    expect(searchView.get('.search-result-stub').text()).toBe('Vue')
  })

  it('clears the route and results immediately when the input is emptied', async () => {
    vi.useFakeTimers()
    const searchArticles = vi.fn(() => ({
      data: [{ id: 'vue', title: 'Vue' }],
      total: 1
    }))
    const { router, wrapper: searchView } = await mountSearchView({
      searchArticles,
      latestArticles: [{ id: 'latest', title: 'Latest article' }],
      initialUrl: '/search?keyword=Vue&page=1'
    })

    expect(searchView.find('.search-result-stub').exists()).toBe(true)
    await searchView.get('.search-input').setValue('')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({})
    expect(searchView.find('.theme-page-status').exists()).toBe(false)
    expect(searchView.get('.search-result-stub').text()).toBe('Latest article')
  })

  it('ignores an older response that resolves after the latest search', async () => {
    vi.useFakeTimers()
    const requests = new Map()
    const searchArticles = vi.fn(({ keyword }) => {
      const deferred = createDeferred()
      requests.set(keyword, deferred)
      return deferred.promise
    })
    const { wrapper: searchView } = await mountSearchView({ searchArticles })
    const input = searchView.get('.search-input')

    await input.setValue('old')
    await advanceRealtimeSearch()
    await input.setValue('new')
    await advanceRealtimeSearch()

    requests.get('new').resolve({ data: [{ id: 'new', title: 'New result' }], total: 1 })
    await flushPromises()
    expect(searchView.get('.search-result-stub').text()).toBe('New result')

    requests.get('old').resolve({ data: [{ id: 'old', title: 'Old result' }], total: 1 })
    await flushPromises()
    expect(searchView.get('.search-result-stub').text()).toBe('New result')
  })
})
