import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import BlogContainer from '../../src/framework/components/core/BlogContainer.vue'
import { BLOG_ROUTE_NAMES } from '../../src/framework/router/routeManifest.js'
import { useConfigStore } from '../../src/framework/stores/config.js'

let wrapper
const originalInnerWidth = window.innerWidth

async function mountBlogContainer({ width = 1440, initialUrl = '/', site } = {}) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width
  })

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
      }
    ]
  })
  const pinia = createPinia()
  const configStore = useConfigStore(pinia)

  if (site) {
    configStore.initConfig({ site })
  }

  await router.push(initialUrl)
  await router.isReady()

  wrapper = mount(BlogContainer, {
    attachTo: document.body,
    global: {
      plugins: [pinia, router],
      stubs: {
        Header: {
          template: '<button type="button" class="header-trigger">Open panel</button>'
        },
        AnnouncementBar: true,
        AnalyticsScripts: true,
        FontAssets: true,
        CodeBlockEnhancer: true,
        Footer: true,
        Sidebar: {
          props: {
            mobile: {
              type: Boolean,
              default: false
            }
          },
          template: '<div class="sidebar-stub" :data-mobile="mobile ? \'true\' : \'false\'"><button v-if="mobile" type="button" class="drawer-first-action">Close</button></div>'
        }
      }
    },
    slots: {
      default: '<div>Content</div>'
    }
  })
  await flushPromises()

  return { configStore, router, wrapper }
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: originalInnerWidth
  })
  document.body.style.overflow = ''
})

describe('BlogContainer sidebar mounting', () => {
  it('uses a focusable main landmark and skip link without viewport-width sizing', async () => {
    const { wrapper: container } = await mountBlogContainer()

    expect(container.get('.theme-shell').classes()).not.toContain('h-screen')
    expect(container.get('.theme-shell').classes()).not.toContain('w-screen')
    expect(container.get('.theme-skip-link').attributes('href')).toBe('#main-content')
    expect(container.get('#main-content').attributes('tabindex')).toBe('-1')
  })

  it('moves focus to the main landmark after a route change', async () => {
    const { router, wrapper: container } = await mountBlogContainer()

    await router.push('/article/focus-target')
    await flushPromises()
    await nextTick()

    expect(document.activeElement).toBe(container.get('#main-content').element)
  })

  it('mounts only the desktop sidebar on desktop widths', async () => {
    const { wrapper: container } = await mountBlogContainer({ width: 1440 })

    expect(container.findAll('.sidebar-stub')).toHaveLength(1)
    expect(container.get('.sidebar-stub').attributes('data-mobile')).toBe('false')
  })

  it('does not mount a hidden desktop sidebar on mobile widths', async () => {
    const { configStore, wrapper: container } = await mountBlogContainer({ width: 900 })
    const trigger = container.get('.header-trigger')

    expect(container.find('.sidebar-stub').exists()).toBe(false)

    trigger.element.focus()
    configStore.openMobileSidebar()
    await flushPromises()

    expect(container.findAll('.sidebar-stub')).toHaveLength(1)
    expect(container.get('.sidebar-stub').attributes('data-mobile')).toBe('true')
    expect(container.get('[role="dialog"]').attributes('aria-modal')).toBe('true')
    expect(container.get('.theme-app').attributes()).toHaveProperty('inert')
    expect(document.activeElement).toBe(container.get('.drawer-first-action').element)

    await container.get('[role="dialog"]').trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(container.get('.drawer-first-action').element)

    configStore.closeMobileSidebar()
    await flushPromises()
    await nextTick()

    expect(document.activeElement).toBe(trigger.element)
  })

  it('does not mount sidebar content on article routes when disabled', async () => {
    const { wrapper: container } = await mountBlogContainer({
      width: 1440,
      initialUrl: '/article/hidden-sidebar',
      site: {
        features: {
          show_sidebar_on_articles: false
        }
      }
    })

    expect(container.find('.sidebar-stub').exists()).toBe(false)
  })
})
