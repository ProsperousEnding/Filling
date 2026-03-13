<template>
  <div class="vue-blog-framework flex flex-col h-screen w-screen overflow-hidden fixed inset-0" :class="{ 'dark': config.theme === 'dark' }">
    <!-- 鍗氬涓诲鍣?-->
    <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <!-- 澶撮儴 -->
      <Header />
      
      <!-- 涓讳綋閮ㄥ垎 -->
      <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        <main class="blog-container py-4">
          <div class="flex flex-col md:flex-row gap-8 min-h-0">
            <!-- 涓诲唴瀹瑰尯鍩?-->
            <div class="flex-1 order-2" :class="[config.sidebarPosition === 'left' ? 'md:order-2' : 'md:order-1']">
              <slot></slot>
            </div>
            
            <!-- 渚ц竟鏍?-->
            <div 
              class="w-full md:w-80 order-1 scrollbar-hide"
              :class="[config.sidebarPosition === 'left' ? 'md:order-1' : 'md:order-2']"
              v-show="shouldShowSidebar"
            >
              <Sidebar />
            </div>
          </div>
        </main>
      
        <!-- 搴曢儴 -->
        <Footer />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from '../layout/Header.vue'
import Footer from '../layout/Footer.vue'
import Sidebar from '../layout/Sidebar.vue'
import { useConfigStore } from '../../stores/config'

const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
})

const configStore = useConfigStore()
const config = configStore
const route = useRoute()

const shouldShowSidebar = computed(() => {
  if (route.path.startsWith('/settings')) {
    return false
  }
  return config.sidebarVisible && config.showProfileInSidebar
})

onMounted(() => {
  if (props.config) {
    configStore.initConfig(props.config)
  }

  configStore.loadThemeFromStorage()

  if (config.theme === 'dark') {
    document.documentElement.classList.add('dark')
  }
})
</script>

<style scoped>
/* 闅愯棌婊氬姩鏉′絾淇濈暀婊氬姩鍔熻兘 */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}
</style>



