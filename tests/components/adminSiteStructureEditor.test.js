import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import AdminSiteStructureEditor from '../../src/site/admin/components/AdminSiteStructureEditor.vue'

let wrapper

const sidebar = {
  desktop_components: ['profile', 'search', 'latest-articles', 'categories', 'tags'],
  article_desktop_components: ['profile', 'announcement', 'search'],
  mobile_components: ['profile', 'search'],
  article_mobile_components: ['profile', 'announcement', 'search']
}

const pageLayouts = {
  persist: true,
  home: { default: 'list', allow_switch: false, columns: 2, wide_columns: 3 },
  articles: { default: 'card', allow_switch: false, columns: 2, wide_columns: 2 },
  categories: { default: 'grid', allow_switch: false, columns: 2, wide_columns: 3 },
  tags: { default: 'list', allow_switch: false, columns: 2, wide_columns: 3 },
  archive: { default: 'timeline', allow_switch: false, columns: 2, wide_columns: 3 }
}

function mountEditor() {
  return mount(AdminSiteStructureEditor, {
    props: { sidebar, pageLayouts }
  })
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('AdminSiteStructureEditor', () => {
  it('updates the active sidebar context without changing other layouts', async () => {
    wrapper = mountEditor()

    await wrapper.get('[aria-label="公告显示状态"]').trigger('click')

    const nextSidebar = wrapper.emitted('update:sidebar')[0][0]
    expect(nextSidebar.desktop_components).toEqual([
      'profile',
      'search',
      'latest-articles',
      'categories',
      'tags',
      'announcement'
    ])
    expect(nextSidebar.mobile_components).toEqual(sidebar.mobile_components)
  })

  it('switches between device and page contexts', async () => {
    wrapper = mountEditor()

    await wrapper.get('[aria-label="设备类型"]').findAll('button').at(1).trigger('click')
    await wrapper.get('[aria-label="页面类型"]').findAll('button').at(1).trigger('click')
    await wrapper.get('[aria-label="公告显示状态"]').trigger('click')

    expect(wrapper.emitted('update:sidebar')[0][0].article_mobile_components).toEqual([
      'profile',
      'search'
    ])
  })

  it('updates page layout defaults and visitor switching independently', async () => {
    wrapper = mountEditor()

    await wrapper.get('[aria-label="首页默认布局"]').setValue('grid')
    await wrapper.get('[aria-label="首页允许访客切换布局"]').trigger('click')

    expect(wrapper.emitted('update:page-layouts')[0][0].home.default).toBe('grid')
    expect(wrapper.emitted('update:page-layouts')[1][0].home.allow_switch).toBe(true)
  })

  it('keeps configured advanced sidebar components editable', () => {
    wrapper = mount(AdminSiteStructureEditor, {
      props: {
        sidebar: {
          ...sidebar,
          desktop_components: ['profile', 'friend-links', 'custom']
        },
        pageLayouts
      }
    })

    expect(wrapper.text()).toContain('高级组件：friend-links')
    expect(wrapper.text()).toContain('高级组件：custom')
  })
})
