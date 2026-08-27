import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import MenuPageListPage from '../../src/framework/views/pageComponents/MenuPageListPage.vue'
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

  wrapper = mount(MenuPageListPage, {
    props: {
      page: {
        items: [{
          key: 'loading-list-cover',
          kind: 'article',
          title: '加载中的列表封面',
          description: '封面完成前使用主题化等待层。',
          cover: 'https://example.com/loading-list.jpg',
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

describe('menu page list cover loading', () => {
  it('replaces the pending surface after the cover loads', async () => {
    mountPage()

    const card = wrapper.get('.article-feed-card')
    const image = wrapper.get('img')

    await wrapper.vm.$nextTick()
    expect(card.classes()).toContain('article-feed-card-with-cover')
    expect(card.classes()).toContain('article-feed-card-cover-pending')

    await image.trigger('load')
    expect(card.classes()).not.toContain('article-feed-card-cover-pending')
  })
})
