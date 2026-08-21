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

const contentSources = {
  files: ['about.md', 'projects.md', 'articles/example.md'],
  folders: ['articles']
}

function mountEditor(options = {}) {
  return mount(AdminMenuEditor, {
    ...options,
    props: {
      contentSources,
      ...options.props
    }
  })
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('AdminMenuEditor', () => {
  it('separates navigation controls from custom page management', () => {
    wrapper = mountEditor({
      props: { pages: [aboutPage] }
    })

    expect(wrapper.findAll('.admin-menu-navigation-row')).toHaveLength(7)
    expect(wrapper.findAll('.admin-custom-page-item')).toHaveLength(1)
    expect(wrapper.text()).toContain('导航菜单')
    expect(wrapper.text()).toContain('自定义页面与链接')
    expect(wrapper.text()).toContain('about.md · /about')
  })

  it('updates the primary menu limit from the navigation editor', async () => {
    wrapper = mountEditor({ props: { pages: [], primaryLimit: 5 } })

    await wrapper.get('[aria-label="一级菜单上限"]').setValue('7')

    expect(wrapper.emitted('update:primary-limit')[0][0]).toBe(7)
  })

  it('keeps a new page local until the simple dialog is complete', async () => {
    wrapper = mountEditor({
      props: { pages: [aboutPage] },
      attachTo: document.body
    })

    await wrapper.get('.admin-custom-pages-section .admin-command').trigger('click')

    expect(wrapper.emitted('update:pages')).toBeUndefined()
    expect(document.activeElement).toBe(wrapper.get('[data-page-name]').element)

    await wrapper.get('[data-page-name]').setValue('项目')
    await wrapper.get('[data-content-file]').setValue('projects.md')

    expect(wrapper.emitted('update:pages')).toBeUndefined()
    await wrapper.findAll('.admin-page-dialog footer .admin-command').at(-1).trigger('click')

    const pages = wrapper.emitted('update:pages')[0][0]
    expect(pages).toEqual(expect.arrayContaining([
      aboutPage,
      expect.objectContaining({
        key: 'projects',
        title: '项目',
        component: 'context',
        file: 'projects.md',
        menu_group: 'primary'
      })
    ]))
    expect(wrapper.find('.admin-page-dialog').exists()).toBe(false)
  })

  it('shows validation in the dialog instead of emitting an incomplete page', async () => {
    wrapper = mountEditor({
      props: { pages: [] }
    })

    await wrapper.get('.admin-custom-pages-section .admin-command').trigger('click')
    await wrapper.findAll('.admin-page-dialog footer .admin-command').at(-1).trigger('click')

    expect(wrapper.get('.admin-page-dialog-error').text()).toBe('请填写页面名称。')
    expect(wrapper.emitted('update:pages')).toBeUndefined()
  })

  it('edits a custom page without exposing or replacing its generated fields', async () => {
    wrapper = mountEditor({
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
    wrapper = mountEditor({
      props: { pages: [] }
    })

    await wrapper.get('[aria-label="首页在菜单中显示"]').trigger('click')

    expect(wrapper.emitted('update:pages')[0][0]).toEqual([{
      key: 'home',
      visible: false
    }])
  })

  it('creates inline content without requiring a repository file', async () => {
    wrapper = mountEditor({ props: { pages: [] } })

    await wrapper.get('.admin-custom-pages-section .admin-command').trigger('click')
    await wrapper.get('[data-page-name]').setValue('说明')
    await wrapper.findAll('.admin-page-source-control button').at(1).trigger('click')
    await wrapper.get('.admin-page-content-field textarea').setValue('# 使用说明')
    await wrapper.get('input[placeholder="/page"]').setValue('/guide')
    await wrapper.findAll('.admin-page-dialog footer .admin-command').at(-1).trigger('click')

    expect(wrapper.emitted('update:pages')[0][0]).toEqual([expect.objectContaining({
      key: 'guide',
      title: '说明',
      component: 'context',
      content: '# 使用说明',
      path: '/guide'
    })])
  })

  it('creates an external navigation link without creating a route page', async () => {
    wrapper = mountEditor({ props: { pages: [], links: [] } })

    await wrapper.get('.admin-custom-pages-section .admin-command').trigger('click')
    await wrapper.findAll('.admin-page-kind-control button').at(3).trigger('click')
    await wrapper.get('[data-page-name]').setValue('GitHub')
    await wrapper.get('input[placeholder="https://github.com/username"]').setValue('https://github.com/example')
    await wrapper.findAll('.admin-page-dialog footer .admin-command').at(-1).trigger('click')

    expect(wrapper.emitted('update:pages')[0][0]).toEqual([])
    expect(wrapper.emitted('update:links')[0][0]).toEqual([{
      key: 'github',
      label: 'GitHub',
      target: 'https://github.com/example',
      menu_group: 'primary'
    }])
  })

  it('lets the user choose whether a new item belongs to the primary or more menu', async () => {
    wrapper = mountEditor({ props: { pages: [], links: [] } })

    await wrapper.get('.admin-custom-pages-section .admin-command').trigger('click')

    expect(wrapper.get('[data-menu-position]').element.value).toBe('primary')
    expect(wrapper.text()).toContain('固定为一级菜单')

    await wrapper.get('[data-page-name]').setValue('项目')
    await wrapper.get('[data-menu-position]').setValue('more')
    await wrapper.get('[data-content-file]').setValue('projects.md')
    await wrapper.findAll('.admin-page-dialog footer .admin-command').at(-1).trigger('click')

    expect(wrapper.emitted('update:pages')[0][0]).toEqual([{
      key: 'projects',
      title: '项目',
      component: 'context',
      file: 'projects.md'
    }])
  })

  it('rejects missing content sources and conflicting routes before closing', async () => {
    wrapper = mountEditor({
      props: {
        pages: [{ ...aboutPage, file: 'missing.md' }]
      }
    })

    await wrapper.get('[aria-label="编辑关于"]').trigger('click')
    await wrapper.findAll('.admin-page-dialog footer .admin-command').at(-1).trigger('click')
    expect(wrapper.get('.admin-page-dialog-error').text()).toContain('真实存在')

    await wrapper.get('[data-content-file]').setValue('projects.md')
    await wrapper.get('input[placeholder="/about"]').setValue('/article/demo')
    await wrapper.findAll('.admin-page-dialog footer .admin-command').at(-1).trigger('click')
    expect(wrapper.get('.admin-page-dialog-error').text()).toContain('现有路由冲突')
    expect(wrapper.emitted('update:pages')).toBeUndefined()
  })

  it('restores focus after closing and traps Tab at the dialog boundary', async () => {
    wrapper = mountEditor({ props: { pages: [] }, attachTo: document.body })
    const trigger = wrapper.get('.admin-custom-pages-section .admin-command')

    await trigger.trigger('click')
    const saveButton = wrapper.findAll('.admin-page-dialog footer .admin-command').at(-1)
    saveButton.element.focus()
    await wrapper.get('.admin-modal-backdrop').trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(wrapper.get('[aria-label="关闭"]').element)

    await wrapper.get('.admin-modal-backdrop').trigger('keydown', { key: 'Escape' })
    await Promise.resolve()
    expect(document.activeElement).toBe(trigger.element)
  })
})
