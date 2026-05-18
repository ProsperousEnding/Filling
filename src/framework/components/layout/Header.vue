<template>
  <header :class="headerClass">
    <div class="blog-container site-header-bar py-3">
      <div class="flex items-center justify-between gap-4">
        <div v-if="showBrandGroup" class="site-brand-group flex min-w-0 items-center gap-3">
          <div
            v-if="showLeadingVisual"
            class="site-header-leading mr-2 flex items-center"
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
            <router-link
              v-if="leadingVisual.title"
              :to="homePath"
              class="site-header-leading-title inline-flex items-center no-underline transition-opacity hover:opacity-80 focus-visible:opacity-80"
              :style="leadingVisualTitleStyle"
            >
              {{ leadingVisual.title }}
            </router-link>
          </div>

          <div v-if="showBrandTitle || showBrandDescription" class="site-brand-copy min-w-0">
            <router-link
              v-if="showBrandTitle"
              :to="homePath"
              class="site-brand-link block truncate text-xl font-medium transition-colors"
            >
              {{ config.blogTitle }}
            </router-link>
            <p
              v-if="showBrandDescription"
              class="site-brand-description hidden truncate text-sm font-light md:block"
            >
              {{ brandDescriptionText }}
            </p>
          </div>
        </div>

        <div
          v-if="showDesktopMenu"
          class="site-header-menu-groups hidden items-center gap-2 md:flex"
        >
          <MenuRenderer
            v-for="group in desktopHeaderMenuGroups"
            :key="group.key"
            :renderer="group.renderer"
            :renderer-props="group.rendererProps"
          />
        </div>

        <div v-if="showActions" class="site-header-actions flex items-center space-x-3">
          <router-link
            v-if="showSearchAction"
            :to="searchPath"
            class="site-header-action rounded-full p-2 transition-all"
            aria-label="搜索"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </router-link>

          <button
            v-if="navbar.showThemeToggle"
            type="button"
            class="site-header-action rounded-full p-2 transition-all"
            aria-label="切换主题"
            @click="toggleTheme"
          >
            <svg v-if="config.theme === 'light'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>

          <button
            v-if="showCoverStyleToggle"
            type="button"
            class="site-header-action site-header-cover-action rounded-full px-2.5 py-2 text-xs font-semibold transition-all"
            :aria-label="`切换封面图源，当前为${currentCoverStyleLabel}`"
            :title="`切换封面图源，当前为${currentCoverStyleLabel}`"
            @click="toggleCoverStyle"
          >
            <span class="site-header-cover-label-full">{{ currentCoverStyleLabel }}</span>
            <span class="site-header-cover-label-compact">{{ compactCoverStyleLabel }}</span>
          </button>

          <button
            v-if="showSidebarToggle"
            type="button"
            class="site-header-action rounded-full p-2 transition-all md:hidden"
            :aria-label="config.mobileSidebarOpen ? '关闭侧边栏' : '打开侧边栏'"
            @click="toggleSidebarDrawer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 5.25h16.5M3.75 18.75h16.5M9.75 9.75h10.5M9.75 14.25h10.5M3.75 9.75h2.25v4.5H3.75z" />
            </svg>
          </button>

          <button
            v-if="showMobileMenuToggle"
            type="button"
            class="site-header-action rounded-full p-2 transition-all md:hidden"
            :aria-label="mobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'"
            @click="toggleMobileMenu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showMobileMenuPanel" :class="mobileNavClass">
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
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useConfigStore } from '../../stores/config'
import MenuRenderer from '../menu/MenuRenderer.vue'
import {
  getPrimaryMenuPagePath,
  resolveHeaderMenuGroups,
  resolveMobileHeaderMenuGroups
} from '../../utils/menuConfig'
import { getSearchPath } from '../../utils/routeLinks'
import { BLOG_ROUTE_NAMES } from '../../router/routeManifest'

const route = useRoute()
const mobileMenuOpen = ref(false)
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

const navbar = computed(() => (
  config.headerConfig?.navbar || {
    sticky: true,
    blur: true,
    showBrand: true,
    showTitle: true,
    showDescription: true,
    showDesktopMenu: true,
    showMobileMenu: true,
    showSearch: true,
    showThemeToggle: true,
    showSidebarToggle: true,
    showMobileMenuToggle: true
  }
))

const homePath = computed(() => getPrimaryMenuPagePath(config.menus, config.routePatterns))
const searchPath = computed(() => getSearchPath(config.routePatterns))
const headerMenuGroups = computed(() => resolveHeaderMenuGroups(config.menus, {
  routePatterns: config.routePatterns,
  pageRegistry: config.pageRegistry,
  activePath: route.path
}))
const mobileHeaderMenuGroups = computed(() => resolveMobileHeaderMenuGroups(config.menus, {
  routePatterns: config.routePatterns,
  pageRegistry: config.pageRegistry,
  activePath: route.path
}))
const desktopHeaderMenuGroups = computed(() => (
  navbar.value.showDesktopMenu ? headerMenuGroups.value : []
))
const showDesktopMenu = computed(() => desktopHeaderMenuGroups.value.length > 0)
const showLeadingVisual = computed(() => navbar.value.showBrand && leadingVisual.value.visible)
const showBrandTitle = computed(() => (
  navbar.value.showBrand && navbar.value.showTitle && Boolean(config.blogTitle)
))
const brandDescriptionText = computed(() => config.blogDescription || config.blogSubtitle || '')
const showBrandDescription = computed(() => (
  navbar.value.showBrand && navbar.value.showDescription && Boolean(brandDescriptionText.value)
))
const showBrandGroup = computed(() => (
  showLeadingVisual.value || showBrandTitle.value || showBrandDescription.value
))
const showSidebarToggle = computed(() => (
  navbar.value.showSidebarToggle
  && config.sidebarVisible
  && (route.name !== BLOG_ROUTE_NAMES.articleDetail || config.showSidebarOnArticles !== false)
))
const showSearchAction = computed(() => (
  navbar.value.showSearch && Boolean(config.pageRegistry?.search)
))
const showMobileMenuToggle = computed(() => (
  navbar.value.showMobileMenu
  && navbar.value.showMobileMenuToggle
  && mobileHeaderMenuGroups.value.length > 0
))
const showCoverStyleToggle = computed(() => (
  config.coverConfig?.fallback === 'seeded'
  && (config.coverConfig?.sourceSwitch?.enabled ?? config.coverConfig?.styleSwitch?.enabled) !== false
  && (
    (Array.isArray(config.coverConfig?.sourceSwitch?.sources) && config.coverConfig.sourceSwitch.sources.length > 1)
    || (Array.isArray(config.coverConfig?.styleSwitch?.styles) && config.coverConfig.styleSwitch.styles.length > 1)
  )
))
const currentCoverStyleLabel = computed(() => (
  config.coverConfig?.sourceSwitch?.labels?.[config.coverStyle]
  || config.coverConfig?.styleSwitch?.labels?.[config.coverStyle]
  || config.coverStyle
))
const compactCoverStyleLabel = computed(() => {
  const label = String(currentCoverStyleLabel.value || '').trim()

  if (!label) {
    return ''
  }

  const compactMap = {
    'MWM 二次元': '二次',
    'MWM 风景': '风景',
    'XJH ACG': 'ACG',
    'Bing 随机': 'Bing'
  }

  return compactMap[label] || label.replace(/\s+/g, '').slice(0, 4)
})
const showActions = computed(() => (
  showSearchAction.value
  || navbar.value.showThemeToggle
  || showCoverStyleToggle.value
  || showSidebarToggle.value
  || showMobileMenuToggle.value
))
const showMobileMenuPanel = computed(() => (
  mobileMenuOpen.value && navbar.value.showMobileMenu && mobileHeaderMenuGroups.value.length > 0
))
const headerClass = computed(() => [
  'site-header',
  'z-50',
  'transition-all',
  'duration-300',
  navbar.value.blur ? 'site-header-has-blur backdrop-blur-md' : '',
  navbar.value.sticky ? 'sticky top-0' : ''
])
const mobileNavClass = computed(() => [
  'site-mobile-nav',
  'md:hidden',
  'transition-all',
  'duration-300',
  navbar.value.blur ? 'site-mobile-nav-has-blur backdrop-blur-md' : ''
])

const toggleTheme = () => {
  configStore.toggleTheme()
}

const toggleCoverStyle = () => {
  configStore.toggleCoverStyle()
}

const toggleSidebarDrawer = () => {
  configStore.toggleMobileSidebar()
}

const toggleMobileMenu = () => {
  if (!showMobileMenuToggle.value) {
    mobileMenuOpen.value = false
    return
  }

  mobileMenuOpen.value = !mobileMenuOpen.value
}

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

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
})

watch(showMobileMenuToggle, (visible) => {
  if (!visible) {
    mobileMenuOpen.value = false
  }
})
</script>

<style scoped>
header {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.site-brand-copy {
  min-width: 0;
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

.site-header-cover-label-compact {
  display: none;
}

:global(.dark) .site-header-leading-title {
  color: rgb(241 245 249 / 0.88);
}

@media (max-width: 640px) {
  .site-header-bar {
    padding-top: 0.55rem;
    padding-bottom: 0.55rem;
  }

  .site-header-bar > div {
    gap: 0.45rem;
  }

  .site-brand-group {
    flex: 1 1 auto;
    gap: 0.38rem;
    min-width: 0;
  }

  .site-header-leading {
    gap: 0.46rem;
    margin-right: 0 !important;
    min-width: 0;
  }

  .site-header-dots {
    gap: 0.32rem;
  }

  .site-header-dot {
    width: 0.78rem;
    height: 0.78rem;
  }

  .site-header-leading-title {
    max-width: 4.4rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.86rem !important;
  }

  .site-brand-copy {
    display: none;
  }

  .site-header-actions {
    flex: 0 0 auto;
    gap: 0.35rem !important;
    margin-left: auto;
    padding-left: 0.25rem;
  }

  .site-header-actions :deep(.site-header-action),
  .site-header-action {
    width: 2.05rem;
    height: 2.05rem;
    padding: 0 !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .site-header-action svg {
    width: 1.05rem;
    height: 1.05rem;
  }

  .site-header-cover-action {
    width: auto;
    min-width: 2.35rem;
    max-width: 3.35rem;
    padding-inline: 0.5rem !important;
    font-size: 0.68rem;
    line-height: 1;
  }

  .site-header-cover-label-full {
    display: none;
  }

  .site-header-cover-label-compact {
    display: inline;
  }
}

@media (max-width: 380px) {
  .site-header-actions {
    gap: 0.25rem !important;
  }

  .site-header-action {
    width: 1.92rem;
    height: 1.92rem;
  }

  .site-header-cover-action {
    min-width: 2.15rem;
    max-width: 2.8rem;
    padding-inline: 0.38rem !important;
  }

  .site-header-leading-title {
    max-width: 3.4rem;
  }
}

@supports (backdrop-filter: blur(12px)) {
  .site-header-has-blur {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .site-mobile-nav-has-blur {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}
</style>
