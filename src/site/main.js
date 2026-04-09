import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createSiteRouter } from './router'
import '@framework/style.css'
import { useConfigStore } from '@framework/stores/config'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  const configStore = useConfigStore(pinia)
  await configStore.bootstrapConfig()
  const router = createSiteRouter({
    routePatterns: configStore.routePatterns,
    menuConfig: configStore.menus
  })

  app.use(router)
  app.mount('#app')
}

bootstrap()
