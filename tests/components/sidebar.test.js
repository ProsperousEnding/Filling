import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
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
    getLatestArticles: getLatestArticles || (() => [])
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

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
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
    expect(viewAllLinks.map(link => link.attributes('href'))).toEqual(['/category/', '/tag/'])
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
