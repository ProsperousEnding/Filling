import { describe, expect, it } from 'vitest'
import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'

import { installBlogRuntimeContext } from '../../src/framework/runtime/runtimeContext.js'
import { useConfigStore } from '../../src/framework/stores/config.js'

function createConfigStore(configProvider) {
  const app = createSSRApp({})
  const pinia = createPinia()

  installBlogRuntimeContext(app, pinia, { configProvider })
  app.use(pinia)

  return useConfigStore(pinia)
}

describe('config store isolation', () => {
  it('keeps concurrent reload sequences local to each Pinia instance', async () => {
    let resolveConfigA
    let resolveConfigB
    const configStoreA = createConfigStore(() => new Promise(resolve => {
      resolveConfigA = resolve
    }))
    const configStoreB = createConfigStore(() => new Promise(resolve => {
      resolveConfigB = resolve
    }))
    const reloadA = configStoreA.reloadConfig()
    const reloadB = configStoreB.reloadConfig()

    resolveConfigB({ site: { title: 'Site B' } })
    await reloadB
    resolveConfigA({ site: { title: 'Site A' } })
    await reloadA

    expect(configStoreA.blogTitle).toBe('Site A')
    expect(configStoreB.blogTitle).toBe('Site B')
  })
})
