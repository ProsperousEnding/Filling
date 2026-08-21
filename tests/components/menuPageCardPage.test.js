import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import MenuPageCardPage from '../../src/framework/views/pageComponents/MenuPageCardPage.vue'
import { useConfigStore } from '../../src/framework/stores/config.js'

let wrapper

function mountPage() {
  const pinia = createPinia()
  const configStore = useConfigStore(pinia)
  configStore.$patch({
    coverConfig: {
      enabled: false,
      list: {
        showCover: true,
        loading: 'lazy',
        objectFit: 'cover',
        placeholder: 'gradient'
      }
    }
  })

  wrapper = mount(MenuPageCardPage, {
    props: {
      page: {
        items: [{
          key: 'article-card-layout',
          kind: 'article',
          title: '文章标题',
          description: '文章摘要',
          category: { label: '分类标签' },
          meta: '2026-08-21',
          cover: 'https://example.com/cover.jpg',
          tags: []
        }]
      }
    },
    global: {
      plugins: [pinia]
    }
  })
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('menu page card cover boundary', () => {
  it('extends through metadata while keeping the title outside', () => {
    mountPage()

    const cover = wrapper.get('.menu-page-card-cover')
    const metadata = cover.get('.menu-page-card-meta-row')

    expect(metadata.text()).toContain('分类标签')
    expect(metadata.text()).toContain('2026-08-21')
    expect(metadata.classes()).toEqual(expect.arrayContaining([
      'article-card-meta',
      'mb-3',
      'gap-2'
    ]))
    expect(cover.find('.menu-page-card-article-title').exists()).toBe(false)
    expect(wrapper.get('.menu-page-card-article-title').element.closest('.menu-page-card-cover')).toBeNull()
  })
})
