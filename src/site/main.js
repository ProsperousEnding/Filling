import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createSiteRouter } from './router'
import '@framework/style.css'
import { loadAllConfigs } from '@framework/config/configLoader'
import { installBlogRuntimeContext } from '@framework/runtime/runtimeContext'
import { useConfigStore } from '@framework/stores/config'
import { createSiteContentAdapter } from './contentAdapter'
import { prepareRuntimeHandoff } from './runtimeHandoff'

async function bootstrap() {
  const runtimeHandoff = prepareRuntimeHandoff()
  const app = createApp(App)
  const pinia = createPinia()
  let configStore = null
  const contentAdapter = createSiteContentAdapter({
    baseUrl: import.meta.env.BASE_URL,
    getConfig: () => configStore
  })

  installBlogRuntimeContext(app, pinia, {
    baseUrl: import.meta.env.BASE_URL,
    contentAdapter,
    configProvider: loadAllConfigs
  })
  app.use(pinia)

  configStore = useConfigStore(pinia)
  await configStore.bootstrapConfig()
  const router = createSiteRouter({
    base: import.meta.env.BASE_URL,
    routePatterns: configStore.routePatterns,
    menuConfig: configStore.menus
  })

  app.use(router)
  await router.isReady()
  app.mount(runtimeHandoff.mountTarget)
  await runtimeHandoff.complete()
}

bootstrap()
