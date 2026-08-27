import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import ArticleCard from '../../src/framework/components/core/ArticleCard.vue'
import ArticleFeedItem from '../../src/framework/components/core/ArticleFeedItem.vue'
import SearchResultCard from '../../src/framework/components/core/SearchResultCard.vue'
import { useConfigStore } from '../../src/framework/stores/config.js'

let wrapper

function mountCard(component) {
  const pinia = createPinia()
  const configStore = useConfigStore(pinia)
  configStore.$patch({
    coverConfig: {
      list: {
        showCover: true,
        loading: 'lazy',
        objectFit: 'cover',
        placeholder: 'gradient'
      }
    }
  })

  wrapper = mount(component, {
    props: {
      article: {
        id: 'broken-cover',
        kind: 'article',
        title: '封面回退测试',
        excerpt: '封面请求失败时仍应保持稳定布局。',
        cover: 'https://example.com/broken.jpg',
        tags: []
      }
    },
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        MeasuredText: { template: '<span />' },
        MeasuredHighlightedText: { template: '<span />' }
      }
    }
  })
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('article cover fallback', () => {
  it('replaces a failed article card image with its configured placeholder', async () => {
    mountCard(ArticleCard)

    await wrapper.get('.article-card-cover-image').trigger('error')

    expect(wrapper.find('.article-card-cover-image').exists()).toBe(false)
    expect(wrapper.find('.article-card-cover-placeholder').exists()).toBe(true)
  })

  it('replaces a failed search result image without collapsing the cover column', async () => {
    mountCard(SearchResultCard)

    await wrapper.get('.search-result-cover-image').trigger('error')

    expect(wrapper.find('.search-result-cover-image').exists()).toBe(false)
    expect(wrapper.find('.search-result-cover-placeholder').exists()).toBe(true)
    expect(wrapper.classes()).not.toContain('search-result-card-without-cover')
  })

  it('replaces a failed article feed image with its overlay placeholder', async () => {
    mountCard(ArticleFeedItem)

    await wrapper.get('.article-feed-cover-image').trigger('error')

    expect(wrapper.find('.article-feed-cover-image').exists()).toBe(false)
    expect(wrapper.find('.article-feed-card-fallback').exists()).toBe(true)
  })

  it('promotes explicitly prioritized article covers', () => {
    const pinia = createPinia()
    const configStore = useConfigStore(pinia)
    configStore.$patch({
      coverConfig: {
        list: {
          showCover: true,
          loading: 'lazy',
          objectFit: 'cover',
          placeholder: 'gradient'
        }
      }
    })

    wrapper = mount(ArticleFeedItem, {
      props: {
        priority: true,
        article: {
          id: 'priority-cover',
          title: '首屏封面',
          excerpt: '首张封面应进入浏览器高优先级请求队列。',
          cover: 'https://example.com/priority.jpg',
          tags: []
        }
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' }
        }
      }
    })

    const image = wrapper.get('.article-feed-cover-image')

    expect(image.attributes('loading')).toBe('eager')
    expect(image.attributes('fetchpriority')).toBe('high')
  })

  it('uses the themed loading surface until a feed cover finishes loading', async () => {
    const pinia = createPinia()
    const configStore = useConfigStore(pinia)
    configStore.$patch({
      coverConfig: {
        list: {
          showCover: true,
          loading: 'lazy',
          objectFit: 'cover',
          placeholder: 'gradient'
        }
      }
    })

    wrapper = mount(ArticleFeedItem, {
      props: {
        article: {
          id: 'loading-cover',
          title: '加载中的封面',
          excerpt: '封面加载时不应暴露纯黑底色。',
          cover: 'https://example.com/loading.jpg',
          tags: []
        }
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' }
        }
      }
    })

    const card = wrapper.get('.article-feed-card')
    const image = wrapper.get('.article-feed-cover-image')

    await wrapper.vm.$nextTick()
    expect(card.classes()).toContain('article-feed-card-cover-pending')
    await image.trigger('load')
    expect(card.classes()).not.toContain('article-feed-card-cover-pending')
  })
})
