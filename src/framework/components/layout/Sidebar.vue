<template>
  <aside
    class="sidebar-container"
    :class="mobile ? 'sidebar-container-mobile' : 'sidebar-container-desktop'"
  >
    <div class="sidebar-content">
      <div v-if="mobile" class="sidebar-mobile-actions">
        <div class="sidebar-mobile-actions-inner">
          <button
            type="button"
            class="sidebar-close-button"
            aria-label="关闭侧边栏"
            @click="closeSidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="sidebar-close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <template v-for="componentKey in activeSidebarComponents" :key="componentKey">
        <section
          v-if="componentKey === 'profile' && config.showProfileInSidebar && hasProfileContent"
          class="sidebar-profile-panel"
        >
          <div class="sidebar-profile-card">
            <div class="sidebar-profile-stack">
              <div v-if="showProfileAvatar" class="sidebar-profile-avatar-frame">
                <div class="sidebar-profile-avatar-shell">
                  <div class="sidebar-profile-avatar">
                    <img
                      v-if="profileAvatarUrl && !avatarLoadFailed"
                      :src="profileAvatarUrl"
                      :alt="displayName || 'Profile avatar'"
                      class="sidebar-profile-avatar-image"
                      loading="lazy"
                      @error="handleAvatarError"
                    />
                    <span v-else class="sidebar-profile-avatar-fallback">{{ avatarInitial }}</span>
                  </div>
                </div>
              </div>

              <div class="sidebar-profile-copy">
                <h3 v-if="displayName" class="sidebar-profile-name">{{ displayName }}</h3>
                <p v-if="displayUsername" class="sidebar-profile-handle">{{ displayUsername }}</p>
                <p v-if="displayTagline" class="sidebar-profile-tagline">{{ displayTagline }}</p>
              </div>

              <p v-if="displayBio" class="sidebar-profile-bio">{{ displayBio }}</p>

              <div v-if="profileMeta.length > 0" class="sidebar-profile-meta">
                <component
                  :is="meta.href ? 'a' : 'span'"
                  v-for="meta in profileMeta"
                  :key="meta.key"
                  :href="meta.href || undefined"
                  class="sidebar-profile-meta-item"
                  :target="meta.href ? '_blank' : undefined"
                  :rel="meta.href ? 'noreferrer' : undefined"
                >
                  {{ meta.label }}
                </component>
              </div>

              <div v-if="profileSocialLinks.length > 0" class="sidebar-profile-socials">
                <a
                  v-for="link in profileSocialLinks"
                  :key="link.id"
                  :href="link.url"
                  class="sidebar-profile-social-link"
                  :class="{ 'sidebar-profile-social-link-icon-only': link.icon && !link.showName }"
                  :title="link.name"
                  :aria-label="link.name"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span v-if="link.icon" class="sidebar-profile-social-icon">{{ link.icon }}</span>
                  <span v-if="link.showName || !link.icon" class="sidebar-profile-social-name">{{ link.name }}</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          v-else-if="componentKey === 'announcement' && hasSidebarAnnouncement"
          class="sidebar-announcement-panel"
        >
          <div class="sidebar-announcement-card" :data-variant="sidebarAnnouncement.variant">
            <div class="sidebar-announcement-copy">
              <span class="sidebar-announcement-badge">{{ sidebarAnnouncementBadge }}</span>
              <div class="sidebar-announcement-content">
                <strong v-if="sidebarAnnouncement.title" class="sidebar-announcement-title">
                  {{ sidebarAnnouncement.title }}
                </strong>
                <p v-if="sidebarAnnouncement.content" class="sidebar-announcement-text">
                  {{ sidebarAnnouncement.content }}
                </p>
              </div>
            </div>

            <component
              :is="sidebarAnnouncement.external ? 'a' : 'router-link'"
              v-if="sidebarAnnouncement.linkUrl && sidebarAnnouncement.linkText"
              :href="sidebarAnnouncement.external ? sidebarAnnouncement.linkUrl : undefined"
              :to="sidebarAnnouncement.external ? undefined : sidebarAnnouncement.linkUrl"
              :target="sidebarAnnouncement.external ? '_blank' : undefined"
              :rel="sidebarAnnouncement.external ? 'noreferrer' : undefined"
              class="sidebar-announcement-link"
            >
              {{ sidebarAnnouncement.linkText }}
            </component>
          </div>
        </section>

        <section
          v-else-if="componentKey === 'search' && searchPageEnabled"
          class="sidebar-search-panel"
        >
          <div class="sidebar-search" role="search">
            <svg xmlns="http://www.w3.org/2000/svg" class="sidebar-search-leading" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索文章..."
              class="sidebar-search-input font-sf-pro"
              @keyup.enter="handleSearch"
            />
            <button
              v-if="searchKeyword"
              type="button"
              class="sidebar-search-clear"
              aria-label="清除搜索"
              @click="searchKeyword = ''"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              class="sidebar-search-submit"
              :disabled="!trimmedSearchKeyword"
              title="搜索"
              aria-label="搜索"
              @click="handleSearch"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </section>

        <template v-else-if="isSidebarMenuComponent(componentKey)">
          <div
            v-if="!isLoading && shouldShowEmptySidebarMenuState && isFirstSidebarMenuComponent(componentKey)"
            class="sidebar-empty-state"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto mb-3 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p class="sidebar-empty-title">暂无侧边栏内容</p>
            <p class="sidebar-empty-copy">添加分类、标签或文章后会显示在这里。</p>
          </div>

          <div
            v-else-if="isLoading && isFirstSidebarMenuComponent(componentKey)"
            class="sidebar-loading-state"
          >
            <div class="loading-spinner"></div>
          </div>

          <template v-else-if="getSidebarMenuSections(componentKey).length > 0">
            <SidebarSection
              v-for="section in getSidebarMenuSections(componentKey)"
              :key="`${componentKey}-${section.key}`"
              :title="section.title"
              :items="section.items"
              show-item-count
            >
              <MenuRenderer
                :renderer="section.renderer"
                :renderer-props="section.rendererProps"
              />
            </SidebarSection>
          </template>
        </template>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BLOG_ROUTE_NAMES } from '../../router/routeManifest'
import { useConfigStore } from '../../stores/config'
import { useCategoryStore } from '../../stores/category'
import { useTagStore } from '../../stores/tag'
import { useArticleStore } from '../../stores/article'
import { getSearchRoute } from '../../utils/routeLinks'
import { getMaxMenuSourceLimit, menuUsesSource, resolveSidebarMenuSections } from '../../utils/menuConfig'
import { resolveSidebarComponents } from '../../utils/sidebarLayout'
import MenuRenderer from '../menu/MenuRenderer.vue'

const props = defineProps({
  mobile: {
    type: Boolean,
    default: false
  }
})

const SidebarSection = defineAsyncComponent(() => import('./SidebarSection.vue'))

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()
const articleStore = useArticleStore()

const config = configStore
const categories = ref([])
const tags = ref([])
const latestArticles = ref([])
const avatarLoadFailed = ref(false)
const searchKeyword = ref('')
const isLoading = ref(true)
const SIDEBAR_MENU_COMPONENT_KEYS = Object.freeze([
  'categories',
  'tags',
  'latest-articles',
  'friend-links',
  'custom'
])
const SIDEBAR_MENU_COMPONENT_KEY_SET = new Set(SIDEBAR_MENU_COMPONENT_KEYS)
const DEFAULT_PROFILE_DISPLAY = Object.freeze({
  showAvatar: true,
  showName: true,
  showUsername: true,
  showTagline: true,
  showBio: true,
  showLocation: true,
  showWebsite: true,
  showSocialLinks: true
})

const trimmedSearchKeyword = computed(() => searchKeyword.value.trim())
const profileDisplay = computed(() => ({
  ...DEFAULT_PROFILE_DISPLAY,
  ...(config.userProfile?.display || {})
}))
const profileAvatarUrl = computed(() => (
  profileDisplay.value.showAvatar
    ? resolveAssetUrl(config.userProfile?.avatarUrl)
    : ''
))
const displayName = computed(() => (
  profileDisplay.value.showName
    ? toTrimmedString(config.userProfile?.displayName) || toTrimmedString(config.userProfile?.username)
    : ''
))
const displayUsername = computed(() => {
  if (!profileDisplay.value.showUsername) return ''

  const username = toTrimmedString(config.userProfile?.username).replace(/^@+/, '')

  if (!username) return ''
  if (displayName.value && displayName.value.toLowerCase() === username.toLowerCase()) return ''

  return `@${username}`
})
const showProfileAvatar = computed(() => Boolean(
  profileDisplay.value.showAvatar && (
    profileAvatarUrl.value ||
    displayName.value ||
    displayUsername.value
  )
))
const displayTagline = computed(() => (
  profileDisplay.value.showTagline
    ? toTrimmedString(config.userProfile?.tagline) || toTrimmedString(config.blogDescription)
    : ''
))
const displayBio = computed(() => (
  profileDisplay.value.showBio
    ? toTrimmedString(config.userProfile?.bio)
    : ''
))
const profileSocialLinks = computed(() => (
  profileDisplay.value.showSocialLinks && Array.isArray(config.userProfile?.socialLinks)
    ? config.userProfile.socialLinks
      .map((link, index) => {
        const name = toTrimmedString(link?.name)
        const url = normalizeExternalUrl(toTrimmedString(link?.url))
        const icon = toTrimmedString(link?.icon)
        const showName = typeof link?.showName === 'boolean' ? link.showName : true

        if (!name || !url) {
          return null
        }

        return {
          id: link?.id || `profile-social-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name,
          url,
          icon,
          showName
        }
      })
      .filter(Boolean)
    : []
))
const profileMeta = computed(() => {
  const meta = []
  const location = profileDisplay.value.showLocation
    ? toTrimmedString(config.userProfile?.location)
    : ''
  const website = profileDisplay.value.showWebsite
    ? toTrimmedString(config.userProfile?.website)
    : ''

  if (location) {
    meta.push({
      key: 'location',
      label: location
    })
  }

  if (website) {
    meta.push({
      key: 'website',
      label: getWebsiteLabel(website),
      href: normalizeExternalUrl(website)
    })
  }

  return meta
})
const hasProfileContent = computed(() => Boolean(
  showProfileAvatar.value ||
  displayName.value ||
  displayUsername.value ||
  displayTagline.value ||
  displayBio.value ||
  profileMeta.value.length ||
  profileSocialLinks.value.length
))
const avatarInitial = computed(() => (displayName.value || '?').charAt(0).toUpperCase())
const needsCategories = computed(() => (
  Boolean(config.pageRegistry?.categories) && menuUsesSource(config.menus, 'categories')
))
const needsTags = computed(() => (
  Boolean(config.pageRegistry?.tags) && menuUsesSource(config.menus, 'tags')
))
const latestArticlesLimit = computed(() => getMaxMenuSourceLimit(config.menus, 'latest-articles', ['sidebar'], 0))
const needsLatestArticles = computed(() => latestArticlesLimit.value > 0 && menuUsesSource(config.menus, 'latest-articles'))
const isArticleDetailPage = computed(() => route.name === BLOG_ROUTE_NAMES.articleDetail)
const activeSidebarComponents = computed(() => resolveSidebarComponents(config.sidebarLayout, {
  mobile: props.mobile,
  article: isArticleDetailPage.value
}))
const sidebarAnnouncement = computed(() => config.announcement || {})
const sidebarAnnouncementBadge = computed(() => {
  switch (sidebarAnnouncement.value.variant) {
    case 'success':
      return '更新'
    case 'warning':
      return '提醒'
    default:
      return '公告'
  }
})
const searchPageEnabled = computed(() => Boolean(config.pageRegistry?.search))
const hasSidebarAnnouncement = computed(() => (
  sidebarAnnouncement.value?.enabled === true
  && Boolean(
    toTrimmedString(sidebarAnnouncement.value.title)
    || toTrimmedString(sidebarAnnouncement.value.content)
    || (
      toTrimmedString(sidebarAnnouncement.value.linkText)
      && toTrimmedString(sidebarAnnouncement.value.linkUrl)
    )
  )
))
const sidebarMenuSections = computed(() => resolveSidebarMenuSections(config.menus, {
  routePatterns: config.routePatterns,
  pageRegistry: config.pageRegistry,
  categories: categories.value,
  tags: tags.value,
  latestArticles: latestArticles.value,
  friendLinks: config.friendLinks,
  showCategoryCount: config.showCategoryCount,
  showTagCount: config.showTagCount,
  formatArticleMeta: (article) => formatDate(article?.createdAt || article?.date)
}))
const sidebarMenuSectionsBySource = computed(() => groupSidebarMenuSections(sidebarMenuSections.value))
const visibleSidebarMenuSections = computed(() => (
  activeSidebarComponents.value.flatMap((componentKey) => (
    SIDEBAR_MENU_COMPONENT_KEY_SET.has(componentKey)
      ? (sidebarMenuSectionsBySource.value[componentKey] || [])
      : []
  ))
))
const hasVisibleSidebarMenuContent = computed(() => visibleSidebarMenuSections.value.length > 0)
const hasMenuLikeSidebarComponent = computed(() => (
  activeSidebarComponents.value.some(componentKey => SIDEBAR_MENU_COMPONENT_KEY_SET.has(componentKey))
))
const shouldShowEmptySidebarMenuState = computed(() => (
  hasMenuLikeSidebarComponent.value
  && !isLoading.value
  && !hasVisibleSidebarMenuContent.value
))

function closeSidebar() {
  if (props.mobile) {
    configStore.closeMobileSidebar()
  }
}

function handleAvatarError() {
  avatarLoadFailed.value = true
}

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeExternalUrl(value) {
  if (!value) return ''
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) {
    return value
  }

  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) {
    return ''
  }

  return `https://${value}`
}

function getWebsiteLabel(value) {
  const normalizedValue = normalizeExternalUrl(value)

  try {
    const url = new URL(normalizedValue)
    return url.hostname.replace(/^www\./i, '')
  } catch {
    return value.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  }
}

function handleSearch() {
  if (!trimmedSearchKeyword.value) return

  router.push(getSearchRoute({
    keyword: trimmedSearchKeyword.value,
    page: 1
  }))

  searchKeyword.value = ''
}

function formatDate(dateString) {
  if (!dateString) return '未知日期'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '未知日期'

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function groupSidebarMenuSections(sections = []) {
  return sections.reduce((groupedSections, section) => {
    const rawSource = toTrimmedString(section?.source)
    const source = SIDEBAR_MENU_COMPONENT_KEY_SET.has(rawSource) ? rawSource : 'custom'

    groupedSections[source].push(section)
    return groupedSections
  }, {
    categories: [],
    tags: [],
    'latest-articles': [],
    'friend-links': [],
    custom: []
  })
}

function isSidebarMenuComponent(componentKey) {
  return SIDEBAR_MENU_COMPONENT_KEY_SET.has(componentKey)
}

function getSidebarMenuSections(componentKey) {
  return sidebarMenuSectionsBySource.value[componentKey] || []
}

function isFirstSidebarMenuComponent(componentKey) {
  if (!isSidebarMenuComponent(componentKey)) {
    return false
  }

  return activeSidebarComponents.value.find(key => SIDEBAR_MENU_COMPONENT_KEY_SET.has(key)) === componentKey
}

function resolveAssetUrl(value) {
  const normalizedValue = toTrimmedString(value)

  if (!normalizedValue) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(normalizedValue) || normalizedValue.startsWith('data:')) {
    return normalizedValue
  }

  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(normalizedValue)) {
    return ''
  }

  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedPath = normalizedValue.replace(/^\.?\//, '').replace(/^\/+/, '')
  return `${baseUrl}${normalizedPath}`.replace(/(?<!:)\/{2,}/g, '/')
}

onMounted(async () => {
  isLoading.value = true

  try {
    const [categoriesData, tagsData, latestArticlesData] = await Promise.all([
      needsCategories.value ? categoryStore.fetchCategories() : Promise.resolve([]),
      needsTags.value ? tagStore.fetchTags() : Promise.resolve([]),
      needsLatestArticles.value
        ? articleStore.fetchLatestArticles(latestArticlesLimit.value)
        : Promise.resolve([])
    ])

    categories.value = (categoriesData || []).filter(category => category && category.id && category.name)
    tags.value = tagsData || []
    latestArticles.value = latestArticlesData || []
  } catch (error) {
    console.error('加载侧边栏数据失败', error)
  } finally {
    isLoading.value = false
  }
})

watch(() => config.userProfile?.avatarUrl, () => {
  avatarLoadFailed.value = false
})
</script>

<style scoped>
.font-sf-pro {
  font-family: var(--font-sans);
}

.sidebar-container {
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgb(241 245 249);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
}

.sidebar-container-desktop {
  border-radius: 1.75rem;
  padding: 1.45rem 1.25rem;
}

.sidebar-container-mobile {
  height: 100%;
  overflow-y: auto;
  border: 0 !important;
  border-radius: inherit;
  padding: 1.05rem 0.9rem 1rem;
  background: transparent !important;
  box-shadow: none !important;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.28) transparent;
}

.sidebar-container-mobile .sidebar-content {
  gap: 1.05rem;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 1.18rem;
}

.sidebar-mobile-actions {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
  margin: 0;
  padding: 0.65rem;
  background: transparent !important;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  pointer-events: none;
}

.sidebar-mobile-actions-inner {
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
}

.sidebar-close-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.05rem;
  height: 2.05rem;
  border-radius: 9999px;
  border: 0;
  background: rgba(15, 23, 42, 0.08);
  color: rgba(15, 23, 42, 0.46);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 8px 22px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px) saturate(1.08);
  -webkit-backdrop-filter: blur(10px) saturate(1.08);
  pointer-events: auto;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.sidebar-close-button:hover {
  background: rgba(15, 23, 42, 0.12);
  color: rgba(15, 23, 42, 0.72);
}

.sidebar-close-icon {
  width: 1rem;
  height: 1rem;
  color: currentColor;
  opacity: 1;
  stroke: currentColor;
  flex-shrink: 0;
  pointer-events: none;
}

.sidebar-profile-panel {
  padding: 0.35rem 0 0.05rem;
}

.sidebar-profile-card {
  padding: 0.12rem 0 0;
}

.sidebar-profile-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.sidebar-profile-avatar-frame {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
}

.sidebar-profile-avatar-shell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  border-radius: 9999px;
  background: transparent;
  border: 0;
  box-shadow: none;
  flex-shrink: 0;
}

.sidebar-profile-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  background: rgb(255 255 255);
  border: 1px solid rgba(191, 219, 254, 0.9);
  flex-shrink: 0;
}

.sidebar-profile-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar-profile-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 1.55rem;
  font-weight: 700;
  color: rgb(59 130 246);
}

.sidebar-profile-copy {
  min-width: 0;
  max-width: 15.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sidebar-profile-handle {
  display: inline-flex;
  align-items: center;
  margin-top: 0.02rem;
  margin-bottom: 0;
  color: rgb(100 116 139);
  font-size: 0.74rem;
  line-height: 1.4;
  font-weight: 500;
}

.sidebar-profile-name {
  margin: 0;
  font-size: 1.08rem;
  line-height: 1.2;
  font-weight: 600;
  color: rgb(30 41 59);
  letter-spacing: -0.02em;
  word-break: break-word;
}

.sidebar-profile-tagline {
  margin-bottom: 0;
  margin-top: 0.04rem;
  font-size: 0.78rem;
  line-height: 1.5;
  color: rgb(100 116 139);
  word-break: break-word;
}

.sidebar-profile-bio {
  max-width: 15.5rem;
  margin: -0.02rem 0 0;
  font-size: 0.74rem;
  line-height: 1.58;
  color: rgb(75 85 99);
}

.sidebar-profile-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.34rem;
}

.sidebar-profile-socials {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.36rem;
  max-width: 15.5rem;
}

.sidebar-profile-meta-item {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 1.5rem;
  padding: 0.14rem 0.56rem;
  border-radius: 9999px;
  background: rgb(248 250 252);
  border: 1px solid rgba(226, 232, 240, 0.92);
  color: rgb(100 116 139);
  font-size: 0.68rem;
  line-height: 1.2;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

a.sidebar-profile-meta-item:hover {
  border-color: rgba(var(--color-primary), 0.2);
  color: rgb(var(--color-primary));
}

.sidebar-profile-social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.34rem;
  min-height: 1.62rem;
  padding: 0.18rem 0.66rem;
  border-radius: 9999px;
  background: rgba(219, 234, 254, 0.5);
  border: 1px solid rgba(191, 219, 254, 0.92);
  color: rgb(37 99 235);
  font-size: 0.7rem;
  line-height: 1.2;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.sidebar-profile-social-link-icon-only {
  width: 1.85rem;
  padding-left: 0.22rem;
  padding-right: 0.22rem;
}

.sidebar-profile-social-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0.9rem;
  font-size: 0.72rem;
  line-height: 1;
  font-weight: 700;
}

.sidebar-profile-social-name {
  min-width: 0;
}

.sidebar-profile-social-link:hover {
  background: rgba(191, 219, 254, 0.72);
  border-color: rgba(147, 197, 253, 0.96);
  color: rgb(29 78 216);
}

.sidebar-announcement-panel {
  padding: 0.05rem 0 0.15rem;
}

.sidebar-announcement-card {
  display: flex;
  flex-direction: column;
  gap: 0.78rem;
  padding: 1rem 1rem 1.05rem;
  border-radius: 1.35rem;
  border: 1px solid rgba(191, 219, 254, 0.95);
  background:
    radial-gradient(circle at top right, rgba(191, 219, 254, 0.38), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 252, 0.94));
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
}

.sidebar-announcement-card[data-variant='success'] {
  border-color: rgba(167, 243, 208, 0.92);
  background:
    radial-gradient(circle at top right, rgba(167, 243, 208, 0.34), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(240, 253, 244, 0.94));
}

.sidebar-announcement-card[data-variant='warning'] {
  border-color: rgba(253, 230, 138, 0.96);
  background:
    radial-gradient(circle at top right, rgba(253, 230, 138, 0.32), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(255, 251, 235, 0.94));
}

.sidebar-announcement-copy {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
}

.sidebar-announcement-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.6rem;
  min-height: 1.65rem;
  padding: 0.28rem 0.65rem;
  border-radius: 9999px;
  background: rgba(37, 99, 235, 0.1);
  color: rgb(37 99 235);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.sidebar-announcement-card[data-variant='success'] .sidebar-announcement-badge {
  background: rgba(16, 185, 129, 0.12);
  color: rgb(5 150 105);
}

.sidebar-announcement-card[data-variant='warning'] .sidebar-announcement-badge {
  background: rgba(245, 158, 11, 0.14);
  color: rgb(217 119 6);
}

.sidebar-announcement-content {
  min-width: 0;
}

.sidebar-announcement-title {
  display: block;
  color: rgb(15 23 42);
  font-size: 0.94rem;
  line-height: 1.45;
}

.sidebar-announcement-text {
  margin: 0.18rem 0 0;
  color: rgb(71 85 105);
  font-size: 0.86rem;
  line-height: 1.6;
}

.sidebar-announcement-link {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  min-height: 2rem;
  padding: 0.34rem 0.9rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.75);
  color: rgb(37 99 235);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 600;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.sidebar-announcement-link:hover {
  background: rgba(255, 255, 255, 0.96);
  transform: translateY(-1px);
}

.sidebar-search {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.8rem;
  padding: 0.2rem 0.24rem 0.2rem 0.82rem;
  border-radius: 9999px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background: rgb(255 255 255);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
  transition: background-color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.sidebar-container-mobile .sidebar-search {
  min-height: 2.58rem;
  padding-left: 0.72rem;
}

.sidebar-container-mobile .sidebar-search-clear,
.sidebar-container-mobile .sidebar-search-submit {
  width: 1.95rem;
  height: 1.95rem;
}

.sidebar-search:focus-within {
  border-color: rgba(147, 197, 253, 1);
  box-shadow: 0 0 0 3px rgba(191, 219, 254, 0.55);
}

.sidebar-search-leading {
  width: 1.02rem;
  height: 1.02rem;
  flex-shrink: 0;
  color: rgb(148 163 184);
}

.sidebar-search-input {
  min-width: 0;
  flex: 1;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  padding: 0 !important;
  color: rgb(51 65 85);
  font-size: 0.92rem;
}

.sidebar-search-input::placeholder {
  color: rgb(148 163 184);
}

.sidebar-search-clear,
.sidebar-search-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.08rem;
  height: 2.08rem;
  border: 0;
  border-radius: 9999px;
  padding: 0 !important;
  transition: background-color 0.18s ease, color 0.18s ease, opacity 0.18s ease;
}

.sidebar-search-clear {
  background: transparent;
  color: rgb(156 163 175);
}

.sidebar-search-clear:hover {
  background: rgba(229, 231, 235, 0.9);
  color: rgb(75 85 99);
}

.sidebar-search-submit {
  background: rgb(191 219 254);
  color: rgb(59 130 246);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.sidebar-search-submit:hover {
  background: rgb(147 197 253);
  color: rgb(37 99 235);
}

.sidebar-search-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sidebar-search-submit:disabled:hover {
  background: rgb(191 219 254);
}

.sidebar-empty-state,
.sidebar-loading-state {
  padding: 1rem 0.75rem;
  text-align: center;
  background: rgba(249, 250, 251, 0.8);
  border-radius: 0.75rem;
}

.sidebar-empty-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgb(75 85 99);
}

.sidebar-empty-copy {
  margin: 0.3rem 0 0;
  font-size: 0.75rem;
  line-height: 1.5;
  color: rgb(107 114 128);
}

.sidebar-loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 5rem;
}

.sidebar-nav-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sidebar-nav-list > li + li {
  margin-top: 0.22rem;
}

.sidebar-nav-list-tags {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sidebar-nav-list-latest {
  gap: 0;
}

.sidebar-nav-list-tags > li + li {
  margin-top: 0;
}

.sidebar-nav-list-latest > li + li {
  margin-top: 0.62rem;
  padding-top: 0;
  border-top: 0;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 1.8rem;
  padding: 0;
  border-radius: 0;
  color: rgb(71 85 105);
  font-size: 0.98rem;
  transition: color 0.18s ease, background-color 0.18s ease;
}

.sidebar-nav-item-tag {
  justify-content: flex-start;
  min-height: auto;
  width: auto;
  padding: 0.26rem 0.66rem;
  border-radius: 9999px;
  background: rgb(248 250 252);
  border: 1px solid rgba(226, 232, 240, 0.92);
  font-size: 0.8rem;
  line-height: 1.2;
}

.sidebar-nav-item-article {
  display: block;
  min-height: auto;
  padding: 0;
  border-radius: 0;
}

.sidebar-nav-item:hover {
  background: transparent;
  color: rgb(37 99 235);
}

.sidebar-nav-item-active {
  background: transparent;
  color: rgb(37 99 235);
}

.sidebar-nav-label {
  min-width: 0;
  flex: 1 1 auto;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-nav-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2rem;
  height: 1.2rem;
  padding: 0 0.34rem;
  border-radius: 9999px;
  background: rgb(248 250 252);
  color: rgb(148 163 184);
  font-size: 0.72rem;
  line-height: 1;
  font-weight: 500;
  flex-shrink: 0;
}

.sidebar-nav-meta {
  min-width: 0;
}

.sidebar-nav-title {
  margin: 0;
  font-size: 0.94rem;
  line-height: 1.35;
  font-weight: 600;
  color: inherit;
}

.sidebar-nav-submeta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.18rem;
  margin-top: 0.18rem;
  color: rgb(100 116 139);
  font-size: 0.74rem;
}

.sidebar-nav-submeta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
}

.sidebar-nav-submeta-icon {
  width: 0.78rem;
  height: 0.78rem;
  flex-shrink: 0;
}

.sidebar-nav-date {
  display: block;
  margin: 0;
  font-size: 0.75rem;
}

.sidebar-tag-count {
  color: currentColor;
  opacity: 0.45;
  font-size: 0.7rem;
}

.loading-spinner {
  width: 1.4rem;
  height: 1.4rem;
  border: 2px solid rgba(var(--color-primary), 0.15);
  border-top-color: rgb(var(--color-primary));
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.sidebar-container-mobile::-webkit-scrollbar {
  width: 6px;
}

.sidebar-container-mobile::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-container-mobile::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 9999px;
}

.sidebar-container-mobile::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.4);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.28s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.dark .sidebar-container {
  background: rgba(15, 23, 42, 0.96);
  border-color: rgba(75, 85, 99, 0.7);
  box-shadow: 0 12px 30px rgba(2, 6, 23, 0.28);
}

.dark .sidebar-mobile-actions {
  background: linear-gradient(180deg, rgba(31, 41, 55, 0.95), rgba(31, 41, 55, 0.72));
}

.dark .sidebar-close-button,
.dark .sidebar-search-clear {
  color: rgb(156 163 175);
}

.dark .sidebar-close-button:hover,
.dark .sidebar-search-clear:hover {
  background: rgba(75, 85, 99, 0.85);
  color: rgb(243 244 246);
}

.dark .sidebar-profile-name,
.dark .sidebar-empty-title {
  color: rgb(243 244 246);
}

.dark .sidebar-profile-panel {
  padding-top: 0.05rem;
}

.dark .sidebar-profile-card {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

.dark .sidebar-profile-avatar-shell {
  background: transparent;
  border: 0;
  box-shadow: none;
}

.dark .sidebar-profile-avatar {
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(96, 165, 250, 0.22);
}

.dark .sidebar-profile-avatar-fallback {
  color: rgb(191 219 254);
}

.dark .sidebar-profile-handle {
  color: rgb(156 163 175);
}

.dark .sidebar-profile-bio {
  color: rgb(203 213 225);
}

.dark .sidebar-profile-tagline {
  color: rgb(186 199 215);
}

.dark .sidebar-nav-submeta,
.dark .sidebar-nav-date,
.dark .sidebar-tag-count,
.dark .sidebar-empty-copy,
.dark .sidebar-search-input::placeholder {
  color: rgb(156 163 175);
}

.dark .sidebar-profile-meta-item {
  background: rgba(30, 41, 59, 0.86);
  border-color: rgba(71, 85, 105, 0.88);
  color: rgb(203 213 225);
}

.dark a.sidebar-profile-meta-item:hover {
  color: rgb(191 219 254);
  border-color: rgba(96, 165, 250, 0.34);
}

.dark .sidebar-announcement-card {
  border-color: rgba(59, 130, 246, 0.3);
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.86));
  box-shadow: 0 22px 42px rgba(2, 6, 23, 0.35);
}

.dark .sidebar-announcement-card[data-variant='success'] {
  border-color: rgba(16, 185, 129, 0.26);
  background:
    radial-gradient(circle at top right, rgba(16, 185, 129, 0.13), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(6, 78, 59, 0.5));
}

.dark .sidebar-announcement-card[data-variant='warning'] {
  border-color: rgba(245, 158, 11, 0.26);
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.13), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(120, 53, 15, 0.5));
}

.dark .sidebar-announcement-title {
  color: rgb(241 245 249);
}

.dark .sidebar-announcement-text {
  color: rgb(203 213 225);
}

.dark .sidebar-announcement-link {
  background: rgba(15, 23, 42, 0.52);
  color: rgb(191 219 254);
}

.dark .sidebar-search {
  border-color: rgba(71, 85, 105, 0.88);
  background: rgba(15, 23, 42, 0.92);
}

.dark .sidebar-search:focus-within {
  border-color: rgba(147, 197, 253, 0.92);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.dark .sidebar-search-input {
  color: rgb(243 244 246);
}

.dark .sidebar-empty-state,
.dark .sidebar-loading-state {
  background: rgba(55, 65, 81, 0.45);
}

.dark .sidebar-container-mobile {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  scrollbar-color: rgba(107, 114, 128, 0.42) transparent;
}

.dark .sidebar-close-button {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(226, 232, 240, 0.58);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 8px 22px rgba(0, 0, 0, 0.18);
}

.dark .sidebar-close-button:hover {
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.82);
}

.dark .sidebar-container-mobile::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.42);
}

.dark .sidebar-container-mobile::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.52);
}

.dark .sidebar-search-submit {
  background: rgb(59 130 246);
  color: rgb(239 246 255);
}

.dark .sidebar-search-submit:hover {
  background: rgb(37 99 235);
}

.dark .sidebar-nav-item:hover {
  background: transparent;
}

.dark .sidebar-nav-item,
.dark .sidebar-nav-badge,
.dark .sidebar-nav-item-tag {
  color: rgb(209 213 219);
}

.dark .sidebar-nav-item-tag,
.dark .sidebar-nav-badge {
  background: rgba(30, 41, 59, 0.86);
  border-color: rgba(71, 85, 105, 0.82);
}

.dark .sidebar-nav-item-active {
  background: transparent;
  color: rgb(191 219 254);
}

.dark .sidebar-nav-item:hover {
  background: rgba(55, 65, 81, 0.72);
  color: rgb(191 219 254);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
