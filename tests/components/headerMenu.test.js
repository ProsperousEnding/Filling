import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import Header from '../../src/framework/components/layout/Header.vue'
import HeaderPillMenu from '../../src/framework/components/menu/renderers/HeaderPillMenu.vue'
import HeaderStackMenu from '../../src/framework/components/menu/renderers/HeaderStackMenu.vue'
import { useConfigStore } from '../../src/framework/stores/config'

const items = [
  { key: 'home', name: 'Home', path: '/' },
  {
    key: 'more',
    name: 'More',
    children: [
      { key: 'about', name: 'About', path: '/about' }
    ]
  }
]

let wrapper

async function mountMenu(component, props = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }]
  })

  await router.push('/')
  await router.isReady()

  wrapper = mount(component, {
    attachTo: document.body,
    props: { items, activePath: '/', ...props },
    global: { plugins: [router] }
  })

  return wrapper
}

async function mountHeader(configInput = null) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }]
  })
  const pinia = createPinia()
  const configStore = useConfigStore(pinia)

  if (configInput) {
    configStore.initConfig(configInput)
  }

  await router.push('/')
  await router.isReady()

  wrapper = mount(Header, {
    attachTo: document.body,
    global: { plugins: [pinia, router] }
  })

  return { configStore, router, wrapper }
}

function getDropdownTrigger(menu) {
  return menu.get('.site-header-nav-link[aria-expanded]')
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('HeaderPillMenu', () => {
  it('toggles a child menu with pointer clicks', async () => {
    const menu = await mountMenu(HeaderPillMenu)
    const trigger = getDropdownTrigger(menu)

    await trigger.trigger('click', { detail: 1 })
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(trigger.attributes('aria-haspopup')).toBeUndefined()
    expect(menu.get('.site-header-nav-dropdown').attributes('role')).toBeUndefined()
    expect(menu.get('.site-header-nav-dropdown-link').attributes('role')).toBeUndefined()

    await trigger.trigger('click', { detail: 1 })
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  it('moves focus into the menu and restores it with Escape', async () => {
    const menu = await mountMenu(HeaderPillMenu)
    const trigger = getDropdownTrigger(menu)

    trigger.element.focus()
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()

    const child = menu.get('.site-header-nav-dropdown-link')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(child.element)

    await child.trigger('keydown', { key: 'Escape' })
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger.element)
  })

  it('closes on outside pointer input', async () => {
    const menu = await mountMenu(HeaderPillMenu)
    const trigger = getDropdownTrigger(menu)

    await trigger.trigger('click', { detail: 1 })
    document.body.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      pointerType: 'mouse'
    }))
    await nextTick()

    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  it('opens on mouse hover but ignores touch hover', async () => {
    const menu = await mountMenu(HeaderPillMenu)
    const trigger = getDropdownTrigger(menu)
    const entry = trigger.element.closest('.site-header-nav-item')

    entry.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }))
    await nextTick()
    expect(trigger.attributes('aria-expanded')).toBe('false')

    entry.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
    await nextTick()
    expect(trigger.attributes('aria-expanded')).toBe('true')
  })
})

describe('HeaderStackMenu', () => {
  it('renders groups as labels and emits selection only for targets', async () => {
    const menu = await mountMenu(HeaderStackMenu, { activePath: '/about' })
    const group = menu.get('[role="group"]')
    const child = menu.get('.site-mobile-nav-child-link')

    expect(group.element.tagName).toBe('DIV')
    expect(group.classes()).toContain('site-mobile-nav-link-active')
    expect(group.attributes('tabindex')).toBeUndefined()

    await group.trigger('click')
    expect(menu.emitted('select')).toBeUndefined()

    await child.trigger('click')
    expect(menu.emitted('select')).toHaveLength(1)
  })
})

describe('Header mobile navigation', () => {
  it('exposes its state and restores trigger focus after Escape', async () => {
    const { wrapper: header } = await mountHeader()
    const trigger = header.get('[aria-controls="site-mobile-navigation"]')

    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(header.find('#site-mobile-navigation').exists()).toBe(false)

    trigger.element.focus()
    await trigger.trigger('click')

    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(header.get('#site-mobile-navigation').exists()).toBe(true)

    await header.get('#site-mobile-navigation').trigger('keydown', { key: 'Escape' })
    await nextTick()

    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(header.find('#site-mobile-navigation').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('closes after navigation', async () => {
    const { router, wrapper: header } = await mountHeader()
    const trigger = header.get('[aria-controls="site-mobile-navigation"]')

    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')

    await router.push('/about')
    await nextTick()

    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(header.find('#site-mobile-navigation').exists()).toBe(false)
  })
})

describe('Header cover style picker', () => {
  it('stays hidden until the source switch is explicitly enabled', async () => {
    const { wrapper: header } = await mountHeader()

    expect(header.find('.site-header-cover-picker').exists()).toBe(false)
  })

  it('shows previews, marks the selection, and applies a selected source', async () => {
    const { configStore, wrapper: header } = await mountHeader({
      cover: {
        seeded_style: 'mwm-anime',
        source_switch: {
          enabled: true,
          sources: ['picsum', 'mwm-anime']
        }
      }
    })
    const trigger = header.get('.site-header-cover-action')

    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(trigger.find('svg').exists()).toBe(true)

    await trigger.trigger('click')

    const options = header.findAll('.site-header-cover-option')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(options).toHaveLength(2)
    expect(header.findAll('.site-header-cover-preview img')).toHaveLength(2)
    expect(header.get('[data-cover-style="picsum"]').attributes('aria-selected')).toBe('true')

    await header.get('[data-cover-style="mwm-anime"]').trigger('click')

    expect(configStore.coverStyle).toBe('mwm-anime')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(header.find('.site-header-cover-menu').exists()).toBe(false)
  })

  it('moves the cover picker into the expanded mobile navigation', async () => {
    const { configStore, wrapper: header } = await mountHeader({
      cover: {
        seeded_style: 'picsum',
        source_switch: {
          enabled: true,
          sources: ['picsum', 'mwm-scenery']
        }
      }
    })
    const navigationTrigger = header.get('[aria-controls="site-mobile-navigation"]')

    await navigationTrigger.trigger('click')

    const coverTrigger = header.get('.site-mobile-cover-trigger')
    expect(coverTrigger.text()).toContain('封面风格')
    expect(coverTrigger.attributes('aria-expanded')).toBe('false')

    await coverTrigger.trigger('click')

    expect(coverTrigger.attributes('aria-expanded')).toBe('true')
    expect(header.findAll('.site-mobile-cover-options [role="option"]')).toHaveLength(2)

    await header.get('[data-mobile-cover-style="mwm-scenery"]').trigger('click')

    expect(configStore.coverStyle).toBe('mwm-scenery')
    expect(header.find('#site-mobile-navigation').exists()).toBe(true)
    expect(header.find('.site-mobile-cover-options').exists()).toBe(false)
  })

  it('closes with Escape or outside pointer input', async () => {
    const { wrapper: header } = await mountHeader({
      cover: {
        source_switch: {
          enabled: true,
          sources: ['picsum', 'mwm-scenery']
        }
      }
    })
    const trigger = header.get('.site-header-cover-action')

    trigger.element.focus()
    await trigger.trigger('click')
    await header.get('.site-header-cover-menu').trigger('keydown', { key: 'Escape' })
    await nextTick()

    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger.element)

    await trigger.trigger('click')
    document.body.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      pointerType: 'mouse'
    }))
    await nextTick()

    expect(trigger.attributes('aria-expanded')).toBe('false')
  })
})
