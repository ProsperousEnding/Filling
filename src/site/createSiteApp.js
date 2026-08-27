import { createApp, createSSRApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { createSiteRouter } from './router'
import { loadAllConfigs } from '@framework/config/configLoader'
import { installBlogRuntimeContext } from '@framework/runtime/runtimeContext'
import { useConfigStore } from '@framework/stores/config'
import { createSiteContentAdapter } from './contentAdapter'

export async function createSiteApp(options = {}) {
  const baseUrl = options.baseUrl || import.meta.env.BASE_URL
  const app = options.ssr || options.hydrate ? createSSRApp(App) : createApp(App)
  const pinia = createPinia()
  let configStore = null
  const contentAdapter = createSiteContentAdapter({
    baseUrl,
    getConfig: () => configStore
  })

  installBlogRuntimeContext(app, pinia, {
    baseUrl,
    contentAdapter,
    configProvider: loadAllConfigs
  })
  app.use(pinia)

  configStore = useConfigStore(pinia)
  await configStore.bootstrapConfig({
    loadStoredTheme: !options.hydrate
  })

  const router = createSiteRouter({
    base: baseUrl,
    history: options.history,
    routePatterns: configStore.routePatterns,
    menuConfig: configStore.menus
  })

  app.use(router)

  if (options.url) {
    await router.push(options.url)
  }

  await router.isReady()

  return {
    app,
    configStore,
    pinia,
    router
  }
}
