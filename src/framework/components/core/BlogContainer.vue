<template>
  <div
    class="vue-blog-framework theme-shell flex flex-col w-full overflow-hidden fixed inset-0"
    :class="shellClass"
    :data-sidebar-position="configState.sidebarPosition"
    :data-sidebar-visible="configState.sidebarVisible ? 'true' : 'false'"
  >
    <Transition name="sidebar-overlay">
      <button
        v-if="showMobileSidebar"
        type="button"
        class="theme-sidebar-overlay fixed inset-0 z-[1300] backdrop-blur-sm lg:hidden"
        aria-label="关闭侧边栏"
        @click="closeMobileSidebar"
      ></button>
    </Transition>

    <Transition :name="sidebarDrawerTransition">
      <div
        v-if="showMobileSidebar"
        ref="mobileSidebarDrawer"
        class="theme-sidebar-drawer fixed inset-y-0 z-[1400] w-full max-w-full p-0 sm:w-[min(24rem,calc(100vw-1rem))] sm:p-2 lg:hidden"
        :class="mobileSidebarPositionClass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-mobile-title"
        tabindex="-1"
        @keydown.tab="trapMobileSidebarFocus"
      >
        <div class="theme-sidebar-drawer-shell h-full overflow-hidden rounded-none sm:rounded-[1.6rem]">
          <Sidebar mobile />
        </div>
      </div>
    </Transition>

    <!-- 博客主容器 -->
    <div
      class="theme-app flex flex-col h-full"
      :inert="showMobileSidebar || undefined"
      :aria-hidden="showMobileSidebar ? 'true' : undefined"
    >
      <a class="theme-skip-link" href="#main-content">跳到正文</a>

      <!-- 头部 -->
      <Header />
      <AnnouncementBar />
      <AnalyticsScripts />
      <FontAssets />
      <CodeBlockEnhancer v-if="shouldEnhanceMarkdown" />

      <!-- 主体部分 -->
      <div class="theme-main flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        <main id="main-content" class="blog-container theme-main-container py-4" tabindex="-1">
          <div class="theme-layout flex flex-col lg:flex-row gap-8 min-h-0">
            <!-- 主内容区域 -->
            <div class="theme-content-column flex-1 order-2 min-w-0" :class="[isSidebarLeft ? 'lg:order-2' : 'lg:order-1']">
              <slot></slot>
            </div>
            
            <!-- 侧边栏 -->
            <div 
              class="theme-sidebar-column hidden lg:sticky lg:top-4 lg:self-start lg:block lg:w-72 order-1"
              :class="[isSidebarLeft ? 'lg:order-1' : 'lg:order-2']"
              v-if="showDesktopSidebar"
            >
              <Sidebar />
            </div>
          </div>
        </main>
      
        <!-- 底部 -->
        <Footer />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AnalyticsScripts from './AnalyticsScripts.vue'
import FontAssets from './FontAssets.vue'
import Header from '../layout/Header.vue'
import AnnouncementBar from '../layout/AnnouncementBar.vue'
import Footer from '../layout/Footer.vue'
import Sidebar from '../layout/Sidebar.vue'
import { useConfigStore } from '../../stores/config'
import { BLOG_ROUTE_NAMES } from '../../router/routeManifest'
import { usesSidebarDrawer } from '../../utils/sidebarViewport'

const props = defineProps({
  config: {
    type: Object,
    default: null
  }
})

const CodeBlockEnhancer = defineAsyncComponent(() => import('./CodeBlockEnhancer.vue'))

const configStore = useConfigStore()
const configState = configStore
const route = useRoute()
const mobileSidebarDrawer = ref(null)
const isMobileViewport = ref(false)
let mobileSidebarReturnFocus = null
let previousBodyOverflow = ''
let mobileSidebarFocusRequestId = 0
const shellClass = computed(() => ({
  dark: configState.theme === 'dark'
}))
const isSidebarLeft = computed(() => configState.sidebarPosition === 'left')
const isArticleRoute = computed(() => route.name === BLOG_ROUTE_NAMES.articleDetail)
const shouldEnhanceMarkdown = computed(() => (
  isArticleRoute.value || String(route.name || '').startsWith('MenuPage')
))
const canShowSidebarOnCurrentRoute = computed(() => (
  configState.sidebarVisible
  && (!isArticleRoute.value || configState.showSidebarOnArticles !== false)
))
const showDesktopSidebar = computed(() => canShowSidebarOnCurrentRoute.value)
const showMobileSidebar = computed(() => canShowSidebarOnCurrentRoute.value && isMobileViewport.value && configState.mobileSidebarOpen)
const mobileSidebarPositionClass = computed(() => (
  isSidebarLeft.value ? 'left-0' : 'right-0'
))
const sidebarDrawerTransition = computed(() => (
  isSidebarLeft.value ? 'sidebar-drawer-left' : 'sidebar-drawer-right'
))

const closeMobileSidebar = () => {
  configStore.closeMobileSidebar()
}

const getMobileSidebarFocusableElements = () => {
  if (!mobileSidebarDrawer.value) return []

  return Array.from(mobileSidebarDrawer.value.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(element => element.getAttribute('aria-hidden') !== 'true')
}

const trapMobileSidebarFocus = (event) => {
  const focusableElements = getMobileSidebarFocusableElements()

  if (focusableElements.length === 0) {
    event.preventDefault()
    mobileSidebarDrawer.value?.focus()
    return
  }

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  const activeElement = document.activeElement

  if (event.shiftKey && (activeElement === firstElement || !mobileSidebarDrawer.value?.contains(activeElement))) {
    event.preventDefault()
    lastElement.focus()
    return
  }

  if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

const handleViewportChange = () => {
  if (typeof window === 'undefined') {
    isMobileViewport.value = false
    return
  }

  isMobileViewport.value = usesSidebarDrawer(window.innerWidth)

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
  configStore.loadThemeFromStorage()

  handleViewportChange()

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('keydown', handleEscape)
  }
})

watch(() => props.config, (config) => {
  if (config && Object.keys(config).length > 0) {
    configStore.initConfig(config)
  }
}, { deep: true, immediate: true })

watch(() => route.fullPath, async (nextPath, previousPath) => {
  closeMobileSidebar()

  if (!previousPath || nextPath === previousPath || typeof document === 'undefined') {
    return
  }

  await nextTick()
  document.getElementById('main-content')?.focus({ preventScroll: true })
})

watch(showMobileSidebar, async (visible) => {
  if (typeof document === 'undefined') {
    return
  }

  const focusRequestId = mobileSidebarFocusRequestId + 1
  mobileSidebarFocusRequestId = focusRequestId

  if (visible) {
    mobileSidebarReturnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()

    if (focusRequestId !== mobileSidebarFocusRequestId) return

    const [firstFocusableElement] = getMobileSidebarFocusableElements()
    const focusTarget = firstFocusableElement || mobileSidebarDrawer.value
    focusTarget?.focus()
    return
  }

  document.body.style.overflow = previousBodyOverflow
  const returnFocusTarget = mobileSidebarReturnFocus
  mobileSidebarReturnFocus = null
  await nextTick()

  if (focusRequestId !== mobileSidebarFocusRequestId) return

  if (returnFocusTarget?.isConnected) {
    returnFocusTarget.focus()
  }
})

onBeforeUnmount(() => {
  mobileSidebarFocusRequestId += 1

  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleViewportChange)
    window.removeEventListener('keydown', handleEscape)
  }

  if (typeof document !== 'undefined') {
    document.body.style.overflow = previousBodyOverflow
  }
})
</script>

<style scoped>
.theme-shell {
  height: 100vh;
  height: 100dvh;
}

.theme-skip-link {
  position: fixed;
  top: max(0.5rem, env(safe-area-inset-top));
  left: max(0.5rem, env(safe-area-inset-left));
  z-index: 1600;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--theme-border-strong, rgba(100, 116, 139, 0.34));
  border-radius: 0.5rem;
  color: var(--theme-heading-color, #0f172a);
  background: var(--theme-panel-background, rgba(255, 255, 255, 0.96));
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
  transform: translateY(calc(-100% - 1rem));
}

.theme-skip-link:focus-visible {
  outline: 2px solid var(--color-primary, #2563eb);
  outline-offset: 2px;
  transform: translateY(0);
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

.theme-sidebar-drawer {
  pointer-events: none;
}

.theme-sidebar-drawer-shell {
  pointer-events: auto;
  background:
    radial-gradient(circle at 16% 0%, rgba(219, 234, 254, 0.9), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
  border: 0 !important;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.22);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

:global(.dark .theme-sidebar-drawer-shell) {
  background:
    radial-gradient(circle at 16% 0%, rgba(30, 64, 175, 0.28), transparent 32%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.45);
}

@media (max-width: 420px) {
  .theme-sidebar-drawer {
    width: 100vw;
  }

  .theme-sidebar-drawer-shell {
    border-radius: 0;
  }
}
</style>
