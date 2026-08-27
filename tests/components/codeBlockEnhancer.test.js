import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import CodeBlockEnhancer from '../../src/framework/components/core/CodeBlockEnhancer.vue'

let wrapper
const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

async function mountEnhancer() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }]
  })

  await router.push('/')
  await router.isReady()

  wrapper = mount(CodeBlockEnhancer, {
    attachTo: document.body,
    global: {
      plugins: [createPinia(), router]
    }
  })
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''

  if (originalClipboardDescriptor) {
    Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor)
  } else {
    delete navigator.clipboard
  }

  vi.restoreAllMocks()
})

describe('CodeBlockEnhancer', () => {
  it('copies code lines without their displayed line numbers', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    })
    document.body.insertAdjacentHTML('beforeend', `
      <div class="markdown-code-block has-line-numbers">
        <button type="button" class="markdown-code-block__button markdown-code-block__copy">复制代码</button>
        <pre><code>
          <span class="markdown-code-block__line"><span class="markdown-code-block__line-number" aria-hidden="true">8</span><span class="markdown-code-block__line-content">const count = 1</span></span>
          <span class="markdown-code-block__line"><span class="markdown-code-block__line-number" aria-hidden="true">9</span><span class="markdown-code-block__line-content"></span></span>
          <span class="markdown-code-block__line"><span class="markdown-code-block__line-number" aria-hidden="true">10</span><span class="markdown-code-block__line-content">console.log(count)</span></span>
        </code></pre>
      </div>
    `)

    await mountEnhancer()
    document.querySelector('.markdown-code-block__copy').click()
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('const count = 1\n\nconsole.log(count)')
  })
})
