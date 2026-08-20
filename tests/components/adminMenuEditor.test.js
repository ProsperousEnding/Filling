import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import AdminMenuEditor from '../../src/site/admin/components/AdminMenuEditor.vue'

let wrapper

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('AdminMenuEditor', () => {
  it('shows built-in and custom pages while keeping unchanged built-ins implicit', async () => {
    wrapper = mount(AdminMenuEditor, {
      props: {
        pages: [{
          key: 'about',
          title: '关于',
          component: 'context',
          file: 'about.md'
        }]
      }
    })

    expect(wrapper.findAll('.admin-menu-page')).toHaveLength(7)
    expect(wrapper.text()).toContain('首页')
    expect(wrapper.text()).toContain('关于')

    await wrapper.get('[aria-label="新增页面"]').trigger('click')

    const pages = wrapper.emitted('update:pages')[0][0]
    expect(pages.filter(page => page.key === 'home')).toHaveLength(0)
    expect(pages).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'about', file: 'about.md' }),
      expect.objectContaining({ key: '', component: 'context' })
    ]))
  })
})
