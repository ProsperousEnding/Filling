<template>
  <header class="site-header backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
    <div class="blog-container site-header-bar py-3">
      <div class="flex items-center justify-between gap-4">
        <!-- 博客标题区域 - Mac风格 -->
        <div class="site-brand-group flex items-center space-x-3">
          <div
            v-if="leadingVisual.visible"
            class="site-header-leading flex items-center mr-2"
          >
            <img
              v-if="leadingVisual.type === 'image' && leadingVisualSrc"
              :src="leadingVisualSrc"
              :alt="leadingVisual.alt || 'Header leading visual'"
              class="site-header-leading-image"
              :style="leadingVisualImageStyle"
            />
            <div v-else class="site-header-dots flex items-center">
              <span
                v-for="(color, index) in leadingVisual.dots.colors"
                :key="`${color}-${index}`"
                class="site-header-dot"
                :style="{ '--site-header-dot-color': color }"
                aria-hidden="true"
              ></span>
            </div>
            <span
              v-if="leadingVisual.title"
              class="site-header-leading-title"
              :style="leadingVisualTitleStyle"
            >
              {{ leadingVisual.title }}
            </span>
          </div>
          <router-link
            v-if="config.blogTitle"
            :to="homePath"
            class="site-brand-link text-xl font-medium transition-colors"
          >
            {{ config.blogTitle }}
          </router-link>
          <p v-if="config.blogDescription" class="site-brand-description hidden md:block text-sm font-light">
            {{ config.blogDescription }}
          </p>
        </div>
        
        <div
          v-if="headerMenuGroups.length > 0"
          class="site-header-menu-groups hidden md:flex items-center gap-2"
        >
          <MenuRenderer
            v-for="group in headerMenuGroups"
            :key="group.key"
            :renderer="group.renderer"
            :renderer-props="group.rendererProps"
          />
        </div>
        
        <!-- 操作区 - Mac风格图标 -->
        <div class="site-header-actions flex items-center space-x-3">
          <!-- 搜索按钮 -->
          <router-link :to="searchPath" class="site-header-action p-2 rounded-full transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </router-link>

          <!-- 主题切换按钮 -->
          <button @click="toggleTheme" class="site-header-action p-2 rounded-full transition-all">
            <svg v-if="config.theme === 'light'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>

          <button
            v-if="config.sidebarVisible"
            @click="toggleSidebarDrawer"
            class="site-header-action md:hidden p-2 rounded-full transition-all"
            :aria-label="config.mobileSidebarOpen ? '关闭侧边栏' : '打开侧边栏'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 5.25h16.5M3.75 18.75h16.5M9.75 9.75h10.5M9.75 14.25h10.5M3.75 9.75h2.25v4.5H3.75z" />
            </svg>
          </button>
          
          <!-- 移动端菜单按钮 -->
          <button @click="toggleMobileMenu" class="site-header-action md:hidden p-2 rounded-full transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 移动端菜单 -->
    <div v-if="mobileMenuOpen" class="site-mobile-nav md:hidden backdrop-blur-md transition-all duration-300">
      <div class="blog-container py-3">
        <MenuRenderer
          v-for="group in mobileHeaderMenuGroups"
          :key="group.key"
          :renderer="group.renderer"
          :renderer-props="group.rendererProps"
          @select="mobileMenuOpen = false"
        />
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useConfigStore } from '../../stores/config'
import { useRoute } from 'vue-router'
import { getHomePath, getSearchPath } from '../../utils/routeLinks'
import { resolveHeaderMenuGroups, resolveMobileHeaderMenuGroups } from '../../utils/menuConfig'
import MenuRenderer from '../menu/MenuRenderer.vue'

// 获取当前路由
const $route = useRoute()

// 移动端菜单控制
const mobileMenuOpen = ref(false)
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

// 获取配置store
const configStore = useConfigStore()
const config = configStore
const leadingVisual = computed(() => (
  config.headerConfig?.leadingVisual || {
    visible: true,
    type: 'dots',
    title: '',
    titleSize: '0.98rem',
    src: '',
    alt: '',
    width: 56,
    height: 18,
    dots: {
      colors: ['#ff5f57', '#febc2e', '#28c840']
    }
  }
))

// 主题切换
const toggleTheme = () => {
  configStore.toggleTheme()
}

const toggleSidebarDrawer = () => {
  configStore.toggleMobileSidebar()
}

// 导航菜单项
const homePath = computed(() => getHomePath(config.routePatterns))
const searchPath = computed(() => getSearchPath(config.routePatterns))
const headerMenuGroups = computed(() => resolveHeaderMenuGroups(config.menus, {
  routePatterns: config.routePatterns,
  activePath: $route.path
}))
const mobileHeaderMenuGroups = computed(() => resolveMobileHeaderMenuGroups(config.menus, {
  routePatterns: config.routePatterns,
  activePath: $route.path
}))

function resolveHeaderAssetUrl(value) {
  const rawValue = String(value || '').trim()

  if (!rawValue) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(rawValue) || rawValue.startsWith('data:')) {
    return rawValue
  }

  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedPath = rawValue.replace(/^\.?\//, '').replace(/^\/+/, '')

  return `${baseUrl}${normalizedPath}`.replace(/(?<!:)\/{2,}/g, '/')
}

const leadingVisualSrc = computed(() => resolveHeaderAssetUrl(leadingVisual.value.src))
const leadingVisualImageStyle = computed(() => ({
  width: `${leadingVisual.value.width}px`,
  height: `${leadingVisual.value.height}px`
}))
const leadingVisualTitleStyle = computed(() => ({
  fontSize: leadingVisual.value.titleSize || '0.98rem'
}))
</script>

<style scoped>
/* 为Mac风格添加一些微妙阴影和过渡效果 */
header {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.site-header-leading {
  flex-shrink: 0;
  gap: 0.75rem;
}

.site-header-leading-image {
  display: block;
  object-fit: contain;
  object-position: left center;
}

.site-header-leading-title {
  font-weight: 600;
  letter-spacing: -0.02em;
  color: rgb(15 23 42 / 0.88);
  white-space: nowrap;
}

.site-header-dots {
  gap: 0.5rem;
  flex-shrink: 0;
}

.site-header-dot {
  width: 0.95rem;
  height: 0.95rem;
  border-radius: 9999px;
  background: var(--site-header-dot-color);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition: transform 0.18s ease, filter 0.18s ease, opacity 0.18s ease;
}

.site-header-dot:hover {
  filter: brightness(0.94);
  transform: translateY(-0.5px);
}

:global(.dark) .site-header-leading-title {
  color: rgb(241 245 249 / 0.88);
}

@supports (backdrop-filter: blur(12px)) {
  header {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}
</style> 
