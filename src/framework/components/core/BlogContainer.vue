<template>
  <div
    class="vue-blog-framework theme-shell flex flex-col h-screen w-screen overflow-hidden fixed inset-0"
    :class="{ 'dark': configState.theme === 'dark' }"
    :data-sidebar-position="configState.sidebarPosition"
    :data-sidebar-visible="configState.sidebarVisible ? 'true' : 'false'"
  >
    <Transition name="sidebar-overlay">
      <button
        v-if="showMobileSidebar"
        type="button"
        class="theme-sidebar-overlay fixed inset-0 z-[1300] backdrop-blur-sm md:hidden"
        aria-label="关闭侧边栏"
        @click="closeMobileSidebar"
      ></button>
    </Transition>

    <Transition :name="sidebarDrawerTransition">
      <div
        v-if="showMobileSidebar"
        class="theme-sidebar-drawer fixed inset-y-0 z-[1400] w-[min(22rem,calc(100vw-1rem))] max-w-full p-2 sm:p-3 md:hidden"
        :class="mobileSidebarPositionClass"
      >
        <div class="theme-sidebar-drawer-shell h-full overflow-hidden rounded-[1.75rem]">
          <Sidebar mobile />
        </div>
      </div>
    </Transition>

    <!-- 鍗氬涓诲鍣?-->
    <div class="theme-app flex flex-col h-full">
      <!-- 澶撮儴 -->
      <Header />
      <AnnouncementBar />

      <!-- 涓讳綋閮ㄥ垎 -->
      <div class="theme-main flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        <main class="blog-container theme-main-container py-4">
          <div class="theme-layout flex flex-col md:flex-row gap-8 min-h-0">
            <!-- 涓诲唴瀹瑰尯鍩?-->
            <div class="theme-content-column flex-1 order-2 min-w-0" :class="[isSidebarLeft ? 'md:order-2' : 'md:order-1']">
              <slot></slot>
            </div>
            
            <!-- 渚ц竟鏍?-->
            <div 
              class="theme-sidebar-column hidden md:block md:w-80 order-1 scrollbar-hide"
              :class="[isSidebarLeft ? 'md:order-1' : 'md:order-2']"
              v-show="showDesktopSidebar"
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Header from '../layout/Header.vue'
import AnnouncementBar from '../layout/AnnouncementBar.vue'
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
const configState = configStore
const route = useRoute()
const isMobileViewport = ref(false)
const isSidebarLeft = computed(() => configState.sidebarPosition === 'left')
const showDesktopSidebar = computed(() => configState.sidebarVisible && !isMobileViewport.value)
const showMobileSidebar = computed(() => configState.sidebarVisible && isMobileViewport.value && configState.mobileSidebarOpen)
const mobileSidebarPositionClass = computed(() => (
  isSidebarLeft.value ? 'left-0' : 'right-0'
))
const sidebarDrawerTransition = computed(() => (
  isSidebarLeft.value ? 'sidebar-drawer-left' : 'sidebar-drawer-right'
))

const closeMobileSidebar = () => {
  configStore.closeMobileSidebar()
}

const handleViewportChange = () => {
  if (typeof window === 'undefined') {
    isMobileViewport.value = false
    return
  }

  isMobileViewport.value = window.innerWidth < 768

  if (!isMobileViewport.value) {
    configStore.closeMobileSidebar()
  }
}

const handleEscape = (event) => {
  if (event.key === 'Escape' && showMobileSidebar.value) {
    closeMobileSidebar()
  }
}

onMounted(() => {
  if (props.config) {
    configStore.initConfig(props.config)
  }

  configStore.loadThemeFromStorage()

  if (configState.theme === 'dark') {
    document.documentElement.classList.add('dark')
  }

  handleViewportChange()

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('keydown', handleEscape)
  }
})

watch(() => route.fullPath, () => {
  closeMobileSidebar()
})

watch(showMobileSidebar, (visible) => {
  if (typeof document === 'undefined') {
    return
  }

  document.body.style.overflow = visible ? 'hidden' : ''
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleViewportChange)
    window.removeEventListener('keydown', handleEscape)
  }

  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
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

.sidebar-overlay-enter-active,
.sidebar-overlay-leave-active {
  transition: opacity 0.24s ease;
}

.sidebar-overlay-enter-from,
.sidebar-overlay-leave-to {
  opacity: 0;
}

.sidebar-drawer-right-enter-active,
.sidebar-drawer-right-leave-active,
.sidebar-drawer-left-enter-active,
.sidebar-drawer-left-leave-active {
  transition: opacity 0.26s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-drawer-right-enter-from,
.sidebar-drawer-right-leave-to {
  opacity: 0;
  transform: translateX(1.5rem);
}

.sidebar-drawer-left-enter-from,
.sidebar-drawer-left-leave-to {
  opacity: 0;
  transform: translateX(-1.5rem);
}
</style>
