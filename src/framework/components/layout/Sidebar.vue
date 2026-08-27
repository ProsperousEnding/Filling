<template>
  <aside
    class="sidebar-container"
    :class="mobile ? 'sidebar-container-mobile' : 'sidebar-container-desktop'"
    :aria-label="mobile ? '内容面板' : '侧边栏'"
  >
    <div class="sidebar-content">
      <div v-if="mobile" class="sidebar-mobile-actions">
        <div class="sidebar-mobile-actions-inner">
          <h2 id="sidebar-mobile-title" class="sidebar-mobile-title">内容面板</h2>
          <button
            type="button"
            class="sidebar-close-button"
            aria-label="关闭内容面板"
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
            <div
              class="sidebar-profile-stack"
              :class="{ 'sidebar-profile-stack-without-avatar': !showProfileAvatar }"
            >
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

              <div
                v-if="profileSocialLinks.length > 0 || profileMeta.length > 0"
                class="sidebar-profile-links-row"
              >
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
                    <svg
                      v-if="link.iconKey === 'github'"
                      xmlns="http://www.w3.org/2000/svg"
                      class="sidebar-profile-social-icon sidebar-profile-social-icon-github"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.29-5.27-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.47.11-3.05 0 0 .96-.31 3.16 1.18A10.9 10.9 0 0 1 12 6.12c.98 0 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.08 0 4.4-2.71 5.38-5.29 5.67.42.36.79 1.07.79 2.16v3.26c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
                    </svg>
                    <span v-else-if="link.icon" class="sidebar-profile-social-icon">{{ link.icon }}</span>
                    <span v-if="link.showName || !link.icon" class="sidebar-profile-social-name">{{ link.name }}</span>
                  </a>
                </div>

                <div v-if="profileMeta.length > 0" class="sidebar-profile-meta">
                  <component
                    :is="meta.href ? 'a' : 'span'"
                    v-for="meta in profileMeta"
                    :key="meta.key"
                    :href="meta.href || undefined"
                    class="sidebar-profile-meta-item"
                    :class="{ 'sidebar-profile-meta-item-website': meta.key === 'website' }"
                    :target="meta.href ? '_blank' : undefined"
                    :rel="meta.href ? 'noreferrer' : undefined"
                  >
                    {{ meta.label }}
                  </component>
                </div>
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
              v-bind="sidebarAnnouncement.external
                ? { href: sidebarAnnouncement.linkUrl }
                : { to: sidebarAnnouncement.linkUrl }"
              :target="sidebarAnnouncement.external ? '_blank' : undefined"
              :rel="sidebarAnnouncement.external ? 'noreferrer' : undefined"
              class="sidebar-announcement-link"
            >
              {{ sidebarAnnouncement.linkText }}
            </component>
          </div>
        </section>

        <template v-else-if="isSidebarMenuComponent(componentKey)">
          <div
            v-if="isLoading && !hasVisibleSidebarMenuContent && isFirstSidebarMenuComponent(componentKey)"
            class="sidebar-loading-state"
          >
            <div class="loading-spinner"></div>
          </div>

          <div
            v-else-if="shouldShowSidebarDataError(componentKey)"
            class="sidebar-error-state"
            role="alert"
          >
            <p class="sidebar-error-title">{{ getSidebarDataErrorMessage(componentKey) }}</p>
            <button type="button" class="sidebar-retry-button" @click="retrySidebarData">
              重新加载
            </button>
          </div>

          <div
            v-else-if="shouldShowEmptySidebarMenuState && isFirstSidebarMenuComponent(componentKey)"
            class="sidebar-empty-state"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto mb-3 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p class="sidebar-empty-title">暂无侧边栏内容</p>
            <p class="sidebar-empty-copy">添加分类、标签或文章后会显示在这里。</p>
          </div>

          <template v-else-if="getSidebarMenuSections(componentKey).length > 0">
            <SidebarSection
              v-for="section in getSidebarMenuSections(componentKey)"
              :key="`${componentKey}-${section.key}`"
              :title="section.title"
              :items="section.items"
              :view-all-to="getSidebarSectionViewAllTo(section)"
              :view-all-label="getSidebarSectionViewAllLabel(section)"
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
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { BLOG_ROUTE_NAMES } from '../../router/routeManifest'
import { useConfigStore } from '../../stores/config'
import { useCategoryStore } from '../../stores/category'
import { useTagStore } from '../../stores/tag'
import { useArticleStore } from '../../stores/article'
import { getCategoriesPath, getTagsPath } from '../../utils/routeLinks'
import { getMaxMenuSourceLimit, menuUsesSource, resolveSidebarMenuSections } from '../../utils/menuConfig'
import { resolveSidebarComponents } from '../../utils/sidebarLayout'
import { useBlogBaseUrl } from '../../runtime/runtimeContext'
import MenuRenderer from '../menu/MenuRenderer.vue'

const props = defineProps({
  mobile: {
    type: Boolean,
    default: false
  }
})

const SidebarSection = defineAsyncComponent(() => import('./SidebarSection.vue'))

const route = useRoute()
const configStore = useConfigStore()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()
const articleStore = useArticleStore()
const baseUrl = useBlogBaseUrl()

const config = configStore
const categories = ref([])
const tags = ref([])
const latestArticles = ref([])
const avatarLoadFailed = ref(false)
const isLoading = ref(false)
const sidebarDataErrors = ref({
  categories: '',
  tags: '',
  'latest-articles': ''
})
let sidebarDataRequestId = 0
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
const displayBio = computed(() => {
  if (!profileDisplay.value.showBio) return ''

  const bio = toTrimmedString(config.userProfile?.bio)
  return bio && bio !== displayTagline.value ? bio : ''
})
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
          iconKey: icon.toLowerCase(),
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
const isArticleDetailPage = computed(() => route.name === BLOG_ROUTE_NAMES.articleDetail)
const activeSidebarComponents = computed(() => resolveSidebarComponents(config.sidebarLayout, {
  mobile: props.mobile,
  article: isArticleDetailPage.value
}))
const needsCategories = computed(() => (
  activeSidebarComponents.value.includes('categories')
  && Boolean(config.pageRegistry?.categories)
  && menuUsesSource(config.menus, 'categories')
))
const needsTags = computed(() => (
  activeSidebarComponents.value.includes('tags')
  && Boolean(config.pageRegistry?.tags)
  && menuUsesSource(config.menus, 'tags')
))
const latestArticlesLimit = computed(() => getMaxMenuSourceLimit(config.menus, 'latest-articles', ['sidebar'], 0))
const needsLatestArticles = computed(() => (
  activeSidebarComponents.value.includes('latest-articles')
  && latestArticlesLimit.value > 0
  && menuUsesSource(config.menus, 'latest-articles')
))
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

function getSidebarSectionViewAllTo(section) {
  if (section?.source === 'categories' && categories.value.length > section.items) {
    return getCategoriesPath(config.routePatterns)
  }

  if (section?.source === 'tags' && tags.value.length > section.items) {
    return getTagsPath(config.routePatterns)
  }

  return ''
}

function getSidebarSectionViewAllLabel(section) {
  if (section?.source === 'categories') return '全部分类'
  if (section?.source === 'tags') return '全部标签'
  return '查看全部'
}

function isFirstSidebarMenuComponent(componentKey) {
  if (!isSidebarMenuComponent(componentKey)) {
    return false
  }

  return activeSidebarComponents.value.find(key => SIDEBAR_MENU_COMPONENT_KEY_SET.has(key)) === componentKey
}

function shouldShowSidebarDataError(componentKey) {
  return Boolean(sidebarDataErrors.value[componentKey])
    && getSidebarMenuSections(componentKey).length === 0
}

function getSidebarDataErrorMessage(componentKey) {
  const labels = {
    categories: '分类',
    tags: '标签',
    'latest-articles': '最新文章'
  }

  return `${labels[componentKey] || '侧边栏内容'}加载失败`
}

function retrySidebarData() {
  loadSidebarData().catch(() => {})
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

  const normalizedPath = normalizedValue.replace(/^\.?\//, '').replace(/^\/+/, '')
  return `${baseUrl}${normalizedPath}`.replace(/(?<!:)\/{2,}/g, '/')
}

function isPromiseLike(value) {
  return value !== null
    && (typeof value === 'object' || typeof value === 'function')
    && typeof value.then === 'function'
}

function settleSidebarSource(source) {
  try {
    const result = source.load()

    if (isPromiseLike(result)) {
      return result.then(
        value => ({ status: 'fulfilled', value }),
        reason => ({ status: 'rejected', reason })
      )
    }

    return { status: 'fulfilled', value: result }
  } catch (reason) {
    return { status: 'rejected', reason }
  }
}

function loadSidebarData() {
  const requestId = sidebarDataRequestId + 1
  sidebarDataRequestId = requestId
  const sources = [
    {
      key: 'categories',
      needed: needsCategories.value,
      load: () => categoryStore.fetchCategories(),
      assign: (value) => {
        categories.value = (value || []).filter(category => category && category.id && category.name)
      }
    },
    {
      key: 'tags',
      needed: needsTags.value,
      load: () => tagStore.fetchTags(),
      assign: (value) => {
        tags.value = Array.isArray(value) ? value : []
      }
    },
    {
      key: 'latest-articles',
      needed: needsLatestArticles.value,
      load: () => articleStore.fetchLatestArticles(latestArticlesLimit.value),
      assign: (value) => {
        latestArticles.value = Array.isArray(value) ? value : []
      }
    }
  ]
  const requestedSources = sources.filter(source => source.needed)
  const nextErrors = { ...sidebarDataErrors.value }

  sources.filter(source => !source.needed).forEach((source) => {
    source.assign([])
    nextErrors[source.key] = ''
  })
  sidebarDataErrors.value = nextErrors

  if (requestedSources.length === 0) {
    isLoading.value = false
    return Promise.resolve([])
  }

  isLoading.value = true
  const settledSources = requestedSources.map(settleSidebarSource)
  const applyResults = (results) => {
    if (requestId !== sidebarDataRequestId) {
      return results
    }

    const resolvedErrors = { ...sidebarDataErrors.value }
    results.forEach((result, index) => {
      const source = requestedSources[index]

      if (result.status === 'fulfilled') {
        source.assign(result.value)
        resolvedErrors[source.key] = ''
        return
      }

      resolvedErrors[source.key] = getSidebarDataErrorMessage(source.key)
      console.error(`${resolvedErrors[source.key]}:`, result.reason)
    })

    sidebarDataErrors.value = resolvedErrors
    isLoading.value = false

    return results
  }

  if (settledSources.some(isPromiseLike)) {
    return Promise.all(settledSources).then(applyResults)
  }

  applyResults(settledSources)
  return Promise.resolve(settledSources)
}

watch(() => config.userProfile?.avatarUrl, () => {
  avatarLoadFailed.value = false
})

watch(
  () => [
    needsCategories.value,
    needsTags.value,
    needsLatestArticles.value,
    latestArticlesLimit.value
  ],
  () => {
    loadSidebarData().catch(() => {})
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  sidebarDataRequestId += 1
})
</script>

<style scoped src="./Sidebar.css"></style>
