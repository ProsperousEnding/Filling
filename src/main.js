import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useConfigStore } from './stores/config'
import { initUmamiTracker } from './services/umamiTracker'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const configStore = useConfigStore(pinia)
initUmamiTracker(router, configStore)

app.mount('#app')
