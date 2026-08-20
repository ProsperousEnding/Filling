import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import AdminMenuEditor from '../../src/site/admin/components/AdminMenuEditor.vue'

let wrapper

const aboutPage = {
  key: 'about',
  title: '关于',
  component: 'context',
  file: 'about.md'
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('AdminMenuEditor', () => {
  it('separates navigation controls from custom page management', () => {
    wrapper = mount(AdminMenuEditor, {
      props: { pages: [aboutPage] }
    })

    expect(wrapper.findAll('.admin-menu-navigation-row')).toHaveLength(7)
    expect(wrapper.findAll('.admin-custom-page-item')).toHaveLength(1)
    expect(wrapper.text()).toContain('导航菜单')
    expect(wrapper.text()).toContain('自定义页面')
    expect(wrapper.text()).toContain('about.md · /about')
  })

  it('keeps a new page local until the simple dialog is complete', async () => {
    wrapper = mount(AdminMenuEditor, {
      props: { pages: [aboutPage] },
      attachTo: document.body
    })

    await wrapper.get('.admin-custom-pages-section .admin-command').trigger('click')

    expect(wrapper.emitted('update:pages')).toBeUndefined()
    expect(document.activeElement).toBe(wrapper.get('[data-page-name]').element)

    await wrapper.get('[data-page-name]').setValue('项目')
    await wrapper.get('input[placeholder="about.md"]').setValue('projects.md')

    expect(wrapper.emitted('update:pages')).toBeUndefined()
    await wrapper.findAll('.admin-page-dialog footer .admin-command').at(-1).trigger('click')

    const pages = wrapper.emitted('update:pages')[0][0]
    expect(pages).toEqual(expect.arrayContaining([
      aboutPage,
      expect.objectContaining({
        key: 'projects',
        title: '项目',
        component: 'context',
        file: 'projects.md'
      })
    ]))
    expect(wrapper.find('.admin-page-dialog').exists()).toBe(false)
  })

  it('shows validation in the dialog instead of emitting an incomplete page', async () => {
    wrapper = mount(AdminMenuEditor, {
      props: { pages: [] }
    })

    await wrapper.get('.admin-custom-pages-section .admin-command').trigger('click')
    await wrapper.findAll('.admin-page-dialog footer .admin-command').at(-1).trigger('click')

    expect(wrapper.get('.admin-page-dialog-error').text()).toBe('请填写页面名称。')
    expect(wrapper.emitted('update:pages')).toBeUndefined()
  })

  it('edits a custom page without exposing or replacing its generated fields', async () => {
    wrapper = mount(AdminMenuEditor, {
      props: { pages: [aboutPage] }
    })

    await wrapper.get('[aria-label="编辑关于"]').trigger('click')
    await wrapper.get('[data-page-name]').setValue('关于本站')
    await wrapper.findAll('.admin-page-dialog footer .admin-command').at(-1).trigger('click')

    expect(wrapper.emitted('update:pages')[0][0]).toEqual([{
      ...aboutPage,
      title: '关于本站'
    }])
  })

  it('updates menu visibility without expanding page fields', async () => {
    wrapper = mount(AdminMenuEditor, {
      props: { pages: [] }
    })

    await wrapper.get('[aria-label="首页在菜单中显示"]').trigger('click')

    expect(wrapper.emitted('update:pages')[0][0]).toEqual([{
      key: 'home',
      visible: false
    }])
  })
})
