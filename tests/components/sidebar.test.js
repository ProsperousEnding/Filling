import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { BLOG_ROUTE_NAMES } from '../../src/framework/router/routeManifest.js'
import Sidebar from '../../src/framework/components/layout/Sidebar.vue'
import { useConfigStore } from '../../src/framework/stores/config.js'

let wrapper

function createDeferred() {
  let resolve
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

async function mountSidebar({
  searchArticles,
  profile,
  site,
  getCategories,
  getTags,
  getLatestArticles,
  stubSections = true
} = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        name: BLOG_ROUTE_NAMES.home,
        component: { template: '<div />' }
      },
      {
        path: '/search',
        name: BLOG_ROUTE_NAMES.search,
        component: { template: '<div />' }
      },
      {
        path: '/article/:id',
        name: BLOG_ROUTE_NAMES.articleDetail,
        component: { template: '<div />' }
      },
      {
        path: '/category',
        name: BLOG_ROUTE_NAMES.categories,
        component: { template: '<div />' }
      },
      {
        path: '/tag',
        name: BLOG_ROUTE_NAMES.tags,
        component: { template: '<div />' }
      }
    ]
  })
  const pinia = createPinia()
  const contentAdapter = {
    getCategories: getCategories || (() => []),
    getTags: getTags || (() => []),
    getLatestArticles: getLatestArticles || (() => []),
    searchArticles: searchArticles || (() => ({ data: [], total: 0 }))
  }

  pinia.use(() => ({
    $blogRuntime: {
      baseUrl: '/',
      contentAdapter
    }
  }))

  const configStore = useConfigStore(pinia)
  if (profile || site) {
    configStore.initConfig({ profile, site })
  }

  await router.push('/')
  await router.isReady()

  wrapper = mount(Sidebar, {
    attachTo: document.body,
    global: {
      plugins: [pinia, router],
      stubs: {
        MenuRenderer: true,
        ...(stubSections ? { SidebarSection: true } : {})
      }
    }
  })
  await flushPromises()

  return { configStore, router, wrapper }
}

async function advanceSidebarSearch() {
  await vi.advanceTimersByTimeAsync(250)
  await flushPromises()
  await nextTick()
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
})

describe('Sidebar realtime search', () => {
  it('shows suggestions after the input debounce without navigating', async () => {
    vi.useFakeTimers()
    const searchArticles = vi.fn(({ keyword }) => ({
      data: [{
        id: 'article:vue',
        kind: 'article',
        title: `${keyword} 入门`,
        category: { name: '前端' },
        to: '/article/vue'
      }],
      total: 3
    }))
    const { router, wrapper: sidebar } = await mountSidebar({ searchArticles })
    const input = sidebar.get('.sidebar-search-input')

    expect(sidebar.find('.sidebar-search-submit').exists()).toBe(false)
    await input.setValue('Vue')
    expect(sidebar.find('.sidebar-search-submit').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(249)
    expect(searchArticles).not.toHaveBeenCalled()

    await advanceSidebarSearch()

    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(searchArticles).toHaveBeenCalledWith({ keyword: 'Vue', page: 1, pageSize: 5 })
    expect(sidebar.get('.sidebar-search-suggestion-title').text()).toBe('Vue 入门')
    expect(sidebar.get('.sidebar-search-suggestion-meta').text()).toBe('前端')
    expect(sidebar.get('.sidebar-search-view-all').text()).toContain('3')
    expect(input.attributes('aria-haspopup')).toBe('listbox')
    expect(sidebar.get('[role="listbox"]').find('.sidebar-search-view-all').exists()).toBe(false)
    expect(sidebar.get('.sidebar-search-view-all').element.parentElement).toBe(
      sidebar.get('.sidebar-search-suggestions').element
    )
  })

  it('supports keyboard selection and clears the search after navigation', async () => {
    vi.useFakeTimers()
    const { router, wrapper: sidebar } = await mountSidebar({
      searchArticles: () => ({
        data: [{
          id: 'article:keyboard',
          kind: 'article',
          title: '键盘导航',
          to: '/article/keyboard'
        }],
        total: 1
      })
    })
    const input = sidebar.get('.sidebar-search-input')

    await input.setValue('键盘')
    await advanceSidebarSearch()
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toContain('option-0')

    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/article/keyboard')
    expect(input.element.value).toBe('')
    expect(sidebar.find('.sidebar-search-suggestions').exists()).toBe(false)
  })

  it('selects the last suggestion when ArrowUp is pressed before a selection', async () => {
    vi.useFakeTimers()
    const { wrapper: sidebar } = await mountSidebar({
      searchArticles: () => ({
        data: [
          { id: 'first', title: 'First', to: '/article/first' },
          { id: 'last', title: 'Last', to: '/article/last' }
        ],
        total: 2
      })
    })
    const input = sidebar.get('.sidebar-search-input')

    await input.setValue('article')
    await advanceSidebarSearch()
    await input.trigger('keydown', { key: 'ArrowUp' })

    expect(input.attributes('aria-activedescendant')).toContain('option-1')
    expect(sidebar.findAll('.sidebar-search-suggestion')[1].classes()).toContain('sidebar-search-suggestion-active')
  })

  it('ignores an older response that resolves after the latest suggestion request', async () => {
    vi.useFakeTimers()
    const requests = new Map()
    const searchArticles = vi.fn(({ keyword }) => {
      const deferred = createDeferred()
      requests.set(keyword, deferred)
      return deferred.promise
    })
    const { wrapper: sidebar } = await mountSidebar({ searchArticles })
    const input = sidebar.get('.sidebar-search-input')

    await input.setValue('old')
    await advanceSidebarSearch()
    await input.setValue('new')
    await advanceSidebarSearch()

    requests.get('new').resolve({
      data: [{ id: 'new', title: 'New result', to: '/article/new' }],
      total: 1
    })
    await flushPromises()
    expect(sidebar.get('.sidebar-search-suggestion-title').text()).toBe('New result')

    requests.get('old').resolve({
      data: [{ id: 'old', title: 'Old result', to: '/article/old' }],
      total: 1
    })
    await flushPromises()
    expect(sidebar.get('.sidebar-search-suggestion-title').text()).toBe('New result')
  })
})

describe('Sidebar data loading', () => {
  it('shows a loading state until the initial sidebar data is ready', async () => {
    const categoriesRequest = createDeferred()
    const { wrapper: sidebar } = await mountSidebar({
      getCategories: () => categoriesRequest.promise
    })

    expect(sidebar.find('.sidebar-loading-state').exists()).toBe(true)

    categoriesRequest.resolve([{ id: 'frontend', name: '前端', count: 1 }])
    await flushPromises()

    expect(sidebar.find('.sidebar-loading-state').exists()).toBe(false)
    expect(sidebar.find('.sidebar-error-state').exists()).toBe(false)
  })

  it('keeps successful sections when another sidebar source fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { wrapper: sidebar } = await mountSidebar({
      getCategories: () => Promise.reject(new Error('categories unavailable')),
      getLatestArticles: () => [{
        id: 'latest',
        title: 'Latest article',
        createdAt: '2026-08-19'
      }]
    })

    expect(sidebar.get('.sidebar-error-title').text()).toBe('分类加载失败')
    expect(sidebar.findAllComponents({ name: 'SidebarSection' }).length).toBeGreaterThan(0)
    consoleError.mockRestore()
  })

  it('reloads affected data when the sidebar menu limit changes', async () => {
    const getLatestArticles = vi.fn(() => [])
    const { configStore } = await mountSidebar({ getLatestArticles })

    expect(getLatestArticles).toHaveBeenCalledWith(5)

    configStore.initConfig({
      site: {
        menus: {
          sidebar: [{
            key: 'latest',
            title: '最新文章',
            renderer: 'sidebar-article',
            source: 'latest-articles',
            limit: 2
          }]
        }
      }
    })
    await flushPromises()

    expect(getLatestArticles).toHaveBeenLastCalledWith(2)
  })

  it('caps default taxonomy sections and links to their complete pages', async () => {
    const categories = Array.from({ length: 9 }, (_, index) => ({
      id: `category-${index}`,
      name: `分类 ${index}`,
      count: 1
    }))
    const tags = Array.from({ length: 13 }, (_, index) => ({
      id: `tag-${index}`,
      name: `标签 ${index}`,
      count: 1
    }))
    const { wrapper: sidebar } = await mountSidebar({
      getCategories: () => categories,
      getTags: () => tags,
      stubSections: false
    })
    await flushPromises()

    await vi.waitFor(() => {
      expect(sidebar.findAll('.sidebar-section-view-all')).toHaveLength(2)
    })

    const viewAllLinks = sidebar.findAll('.sidebar-section-view-all')
    expect(viewAllLinks.map(link => link.text())).toEqual(['全部分类', '全部标签'])
    expect(viewAllLinks.map(link => link.attributes('href'))).toEqual(['/category', '/tag'])
    expect(sidebar.findAll('.sidebar-section-count').map(count => count.text())).toContain('8')
    expect(sidebar.findAll('.sidebar-section-count').map(count => count.text())).toContain('12')
  })
})

describe('Sidebar profile', () => {
  it('removes the avatar grid column when the avatar is disabled', async () => {
    const { wrapper: sidebar } = await mountSidebar({
      profile: {
        display_name: 'Filling',
        display: {
          show_avatar: false
        }
      }
    })

    expect(sidebar.find('.sidebar-profile-avatar-frame').exists()).toBe(false)
    expect(sidebar.get('.sidebar-profile-stack').classes()).toContain(
      'sidebar-profile-stack-without-avatar'
    )
  })

  it('does not repeat a bio that is identical to the tagline', async () => {
    const { wrapper: sidebar } = await mountSidebar({
      profile: {
        display_name: 'Filling',
        tagline: '记录内容系统。',
        bio: '记录内容系统。'
      }
    })

    expect(sidebar.get('.sidebar-profile-tagline').text()).toBe('记录内容系统。')
    expect(sidebar.find('.sidebar-profile-bio').exists()).toBe(false)
  })
})
