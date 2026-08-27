import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import DeferredImage from '../../src/framework/components/core/DeferredImage.vue'

let originalIntersectionObserver
let wrapper

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  globalThis.IntersectionObserver = originalIntersectionObserver
  vi.restoreAllMocks()
})

describe('DeferredImage', () => {
  it('waits for the image to approach the viewport before assigning sources', async () => {
    originalIntersectionObserver = globalThis.IntersectionObserver
    let intersectionCallback
    const disconnect = vi.fn()

    globalThis.IntersectionObserver = class IntersectionObserverMock {
      constructor(callback) {
        intersectionCallback = callback
      }

      observe() {}

      disconnect() {
        disconnect()
      }
    }

    wrapper = mount(DeferredImage, {
      props: {
        src: 'https://images.example.com/cover.webp',
        srcset: 'https://images.example.com/cover-small.webp 480w, https://images.example.com/cover.webp 1200w',
        loading: 'lazy'
      }
    })

    expect(wrapper.attributes('src')).toBeUndefined()
    expect(wrapper.attributes('srcset')).toBeUndefined()
    expect(wrapper.attributes('data-image-state')).toBe('idle')

    intersectionCallback([{ isIntersecting: true }])
    await wrapper.vm.$nextTick()

    expect(wrapper.attributes('src')).toBe('https://images.example.com/cover.webp')
    expect(wrapper.attributes('srcset')).toContain('cover-small.webp 480w')
    expect(wrapper.attributes('data-image-state')).toBe('loading')
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('assigns eager image sources immediately', () => {
    originalIntersectionObserver = globalThis.IntersectionObserver
    let observerCount = 0
    globalThis.IntersectionObserver = class IntersectionObserverMock {
      constructor() {
        observerCount += 1
      }
    }

    wrapper = mount(DeferredImage, {
      props: {
        src: 'https://images.example.com/cover.webp',
        loading: 'eager'
      }
    })

    expect(wrapper.attributes('src')).toBe('https://images.example.com/cover.webp')
    expect(wrapper.attributes('decoding')).toBe('async')
    expect(wrapper.attributes('data-image-state')).toBe('loading')
    expect(observerCount).toBe(0)
  })

  it('reveals an image only after it has loaded', async () => {
    wrapper = mount(DeferredImage, {
      props: {
        src: 'https://images.example.com/cover.webp',
        loading: 'eager'
      }
    })

    expect(wrapper.attributes('data-image-state')).toBe('loading')
    await wrapper.trigger('load')
    expect(wrapper.attributes('data-image-state')).toBe('loaded')
    expect(wrapper.emitted('load')).toHaveLength(1)
  })

  it('retries the original MWM source once when an image proxy is unavailable', async () => {
    const source = 'https://t.alcy.cc/pc/?seed=12'
    const proxy = new URL('https://filling-config-api.initzo.com/image/cover')
    proxy.searchParams.set('url', source)
    proxy.searchParams.set('width', '800')

    wrapper = mount(DeferredImage, {
      props: {
        src: proxy.toString(),
        srcset: `${proxy.toString()} 800w`,
        loading: 'eager'
      }
    })

    await wrapper.trigger('error')
    expect(wrapper.attributes('src')).toBe(source)
    expect(wrapper.attributes('srcset')).toBeUndefined()
    expect(wrapper.attributes('data-image-state')).toBe('loading')
    expect(wrapper.emitted('error')).toBeUndefined()

    await wrapper.trigger('error')
    expect(wrapper.emitted('error')).toHaveLength(1)
  })
})
