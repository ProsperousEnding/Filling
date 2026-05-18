<template>
  <div
    class="article-detail-view"
    :class="articleViewClass"
  >
    <div
      v-if="isArticleCoverPageBackground"
      class="article-detail-page-background"
      :style="articlePageBackgroundStyle"
      aria-hidden="true"
    ></div>

    <!-- 加载中 -->
    <div v-if="loading" class="py-12 flex justify-center">
      <div class="theme-loading-inline inline-flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        正在加载文章...
      </div>
    </div>

    <!-- 文章找不到 -->
    <div v-else-if="hasResolved && !article" class="theme-empty-state py-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="theme-empty-icon h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="theme-empty-title text-xl font-bold mb-2">文章未找到</h2>
      <p class="theme-empty-text mb-6">该文章可能已被删除或您访问的链接有误</p>
      <router-link :to="homeRoute" class="btn-primary">返回首页</router-link>
    </div>

    <!-- 文章内容 -->
    <article v-else class="article-detail-shell">
      <!-- 文章头部 -->
      <header
        class="article-detail-header mb-8"
        :class="articleHeaderClass"
        :style="articleHeaderStyle"
      >
        <div v-if="isArticleCoverHeaderBackground" class="article-detail-header-background-overlay"></div>
        <div :class="isArticleCoverHeaderBackground ? 'article-detail-header-content' : ''">
        <!-- 分类 -->
        <div class="mb-4" v-if="article.category">
          <component
            :is="categoryPageEnabled ? 'router-link' : 'span'"
            :to="categoryPageEnabled ? getCategoryRoute(article.category) : undefined"
            class="article-detail-category"
          >
            {{ typeof article.category === 'string' ? article.category : article.category.name }}
          </component>
        </div>

        <!-- 标题 -->
        <h1 class="article-detail-title text-3xl font-bold mb-4">
          {{ article.title }}
        </h1>

        <!-- 文章元信息 -->
        <div class="article-detail-meta flex flex-wrap items-center text-sm">
          <div class="article-detail-meta-item flex items-center mr-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{{ formatDate(article.createdAt) }}</span>
          </div>
          <div v-if="displayUpdatedAt" class="article-detail-meta-item flex items-center mr-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 4v5h.582m14.836 2A8.001 8.001 0 005.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-13.837-2m13.837 2H15" />
            </svg>
            <span>更新于 {{ formatDate(displayUpdatedAt) }}</span>
          </div>
          <div v-if="config.showReadTime && article.readTime" class="article-detail-meta-item flex items-center mr-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>约 {{ article.readTime }} 分钟阅读</span>
          </div>
        </div>
        </div>
      </header>

      <!-- 封面图 -->
      <div
        v-if="showArticleCoverImage"
        class="article-detail-cover relative mb-8"
        :class="articleCoverAspectRatio ? 'overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800/70' : ''"
        :style="articleCoverShellStyle"
      >
        <img
          :src="articleCover"
          :alt="article.title"
          :loading="articleCoverLoading"
          class="article-detail-cover-image w-full rounded-lg"
          :class="articleCoverAspectRatio ? 'h-full rounded-none' : 'h-auto'"
          :style="articleCoverImageStyle"
        />
        <span
          v-if="coverWatermarkText"
          class="article-detail-cover-watermark"
          :class="coverWatermarkClass"
          :style="coverWatermarkStyle"
        >
          {{ coverWatermarkText }}
        </span>
      </div>
      <div
        v-else-if="showArticleCoverPlaceholder"
        class="article-detail-cover-placeholder mb-8"
        :data-placeholder="coverDetailConfig.placeholder"
        :style="articleCoverShellStyle"
      >
        <svg v-if="coverDetailConfig.placeholder === 'icon'" xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <section
        v-if="outdatedNotice"
        class="article-detail-outdated mb-8 rounded-2xl border border-amber-200 bg-amber-50/90 px-5 py-4 text-sm text-amber-900"
      >
        <p class="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700/80">内容提醒</p>
        <p class="leading-7">
          这篇文章最后{{ outdatedNotice.referenceKind === 'updated' ? '更新' : '发布' }}于
          {{ formatDate(outdatedNotice.referenceAt) }}，距今已超过 {{ outdatedNotice.thresholdDays }} 天，
          部分内容可能已经过时，请结合当前版本或官方文档核实。
        </p>
      </section>

      <!-- 文章内容 -->
      <div class="article-detail-content article-content prose prose-lg dark:prose-invert max-w-none mb-8" v-html="article.content"></div>

      <!-- 文章标签 -->
      <div class="article-detail-tags-wrap mb-8" v-if="article.tags && article.tags.length > 0">
        <div class="article-detail-tags flex flex-wrap">
          <component
            v-for="tag in article.tags"
            :key="typeof tag === 'string' ? tag : tag.id"
            :is="tagPageEnabled ? 'router-link' : 'span'"
            :to="tagPageEnabled ? getTagRoute(tag) : undefined"
            class="tag"
          >
            {{ typeof tag === 'string' ? tag : tag.name }}
          </component>
        </div>
      </div>

      <section
        v-if="articleLicense"
        class="article-detail-license mb-10 rounded-2xl border border-slate-200 bg-slate-50/90 px-5 py-4 text-sm text-slate-600"
      >
        <p class="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">许可协议</p>
        <component
          :is="articleLicense.url ? 'a' : 'span'"
          :href="articleLicense.url || undefined"
          :target="articleLicense.external ? '_blank' : undefined"
          :rel="articleLicense.external ? 'noreferrer' : undefined"
          class="font-medium text-slate-700"
        >
          {{ articleLicense.name }}
        </component>
      </section>

      <SponsorSection />
      <CommentSection :article="article" />

      <!-- 相关文章 -->
      <div class="article-detail-related mb-12" v-if="relatedArticles.length > 0">
        <h3 class="theme-section-heading text-xl font-bold mb-4">相关文章</h3>
        <div class="article-detail-related-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="related in relatedArticles"
            :key="related.id"
            class="article-detail-related-card theme-grid-card rounded-lg overflow-hidden transition-shadow"
          >
            <router-link :to="articleRoute(related)">
              <img
                v-if="showRelatedCover && getRelatedArticleCover(related)"
                :src="getRelatedArticleCover(related)"
                :alt="related.title"
                :loading="relatedCoverLoading"
                class="article-detail-related-image w-full h-40 object-cover"
                :style="relatedCoverImageStyle"
              />
              <div class="article-detail-related-body p-4">
                <h4 class="article-detail-related-title text-lg font-medium mb-2 line-clamp-2">
                  {{ related.title }}
                </h4>
                <p class="article-detail-related-date text-sm">
                  {{ formatDate(related.createdAt) }}
                </p>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import CommentSection from '../components/core/CommentSection.vue'
import SponsorSection from '../components/core/SponsorSection.vue'
import { useArticleStore } from '../stores/article'
import { useConfigStore } from '../stores/config'
import { resolveOutdatedNotice, shouldShowUpdatedAt } from '../utils/articleMeta'
import { resolveDisplayArticleCover } from '../utils/articleCover'
import { getArticleRoute, getCategoryRoute, getHomeRoute, getTagRoute } from '../utils/routeLinks'
import { usePageMetadata } from '../composables/usePageMetadata'

// 获取路由参数
const route = useRoute()
const articleId = computed(() => route.params.id)
const homeRoute = getHomeRoute()

// 获取store
const articleStore = useArticleStore()
const configStore = useConfigStore()
const config = configStore
const articleRoute = (target) => getArticleRoute(target)
const categoryPageEnabled = computed(() => Boolean(config.pageRegistry?.categories))
const tagPageEnabled = computed(() => Boolean(config.pageRegistry?.tags))

// 状态
const article = ref(null)
const relatedArticles = ref([])
const loading = ref(true)
const hasResolved = ref(false)
let activeRequestId = 0
const displayUpdatedAt = computed(() => {
  const updatedAt = article.value?.updatedAt

  if (!updatedAt) {
    return ''
  }

  if (!shouldShowUpdatedAt(updatedAt, article.value?.createdAt || article.value?.date)) {
    return ''
  }

  return updatedAt
})
const outdatedNotice = computed(() => (
  resolveOutdatedNotice(article.value, {
    showOutdatedNotice: config.showOutdatedNotice,
    outdatedThresholdDays: config.outdatedThresholdDays
  })
))
const coverDetailConfig = computed(() => {
  const detail = configStore.coverConfig?.detail

  if (!detail || typeof detail !== 'object') {
    return {
      showCover: true,
      showRelatedCover: true,
      displayMode: 'image',
      loading: 'eager',
      aspectRatio: '',
      objectFit: 'cover',
      placeholder: 'gradient',
      watermark: {
        enabled: false,
        text: '',
        position: 'bottom-right',
        opacity: 0.72
      }
    }
  }

  return {
    showCover: detail.showCover !== false,
    showRelatedCover: detail.showRelatedCover !== false,
    displayMode: ['image', 'header-background', 'page-background'].includes(String(detail.displayMode || '').trim())
      ? String(detail.displayMode || '').trim()
      : 'image',
    loading: detail.loading === 'lazy' ? 'lazy' : 'eager',
    aspectRatio: String(detail.aspectRatio || '').trim(),
    objectFit: String(detail.objectFit || 'cover').trim() || 'cover',
    placeholder: ['none', 'gradient', 'icon'].includes(String(detail.placeholder || '').trim())
      ? String(detail.placeholder || '').trim()
      : 'gradient',
    watermark: normalizeCoverWatermark(detail.watermark)
  }
})
const articleCoverAspectRatio = computed(() => coverDetailConfig.value.aspectRatio)
const articleCover = computed(() => resolveDisplayArticleCover(article.value, {
  coverConfig: configStore.coverConfig,
  style: configStore.coverStyle
}))
const showArticleCover = computed(() => (
  Boolean(articleCover.value)
  && coverDetailConfig.value.showCover
))
const articleCoverDisplayMode = computed(() => {
  const articleMode = String(article.value?.coverDisplayMode || '').trim()

  return ['image', 'header-background', 'page-background'].includes(articleMode)
    ? articleMode
    : coverDetailConfig.value.displayMode
})
const isArticleCoverHeaderBackground = computed(() => (
  showArticleCover.value && articleCoverDisplayMode.value === 'header-background'
))
const isArticleCoverPageBackground = computed(() => (
  showArticleCover.value && articleCoverDisplayMode.value === 'page-background'
))
const showArticleCoverImage = computed(() => (
  showArticleCover.value
  && !isArticleCoverHeaderBackground.value
  && !isArticleCoverPageBackground.value
))
const showArticleCoverPlaceholder = computed(() => (
  coverDetailConfig.value.showCover
  && !articleCover.value
  && coverDetailConfig.value.placeholder !== 'none'
))
const showRelatedCover = computed(() => coverDetailConfig.value.showRelatedCover)
const articleCoverLoading = computed(() => coverDetailConfig.value.loading)
const relatedCoverLoading = computed(() => (
  coverDetailConfig.value.loading === 'eager'
    ? 'lazy'
    : coverDetailConfig.value.loading
))
const articleCoverShellStyle = computed(() => (
  articleCoverAspectRatio.value
    ? { aspectRatio: articleCoverAspectRatio.value }
    : {}
))
const articleCoverImageStyle = computed(() => ({
  objectFit: coverDetailConfig.value.objectFit
}))
const articleHeaderClass = computed(() => ({
  'article-detail-header-with-background': isArticleCoverHeaderBackground.value
}))
const articleHeaderStyle = computed(() => (
  isArticleCoverHeaderBackground.value
    ? {
      backgroundImage: `url("${String(articleCover.value).replace(/"/g, '\\"')}")`
    }
    : {}
))
const articleViewClass = computed(() => ({
  'article-detail-view-with-page-background': isArticleCoverPageBackground.value
}))
const articlePageBackgroundStyle = computed(() => (
  isArticleCoverPageBackground.value
    ? {
      backgroundImage: `url("${String(articleCover.value).replace(/"/g, '\\"')}")`
    }
    : {}
))
const relatedCoverImageStyle = computed(() => ({
  objectFit: coverDetailConfig.value.objectFit
}))
const getRelatedArticleCover = (target) => resolveDisplayArticleCover(target, {
  coverConfig: configStore.coverConfig,
  style: configStore.coverStyle
})
const coverWatermarkText = computed(() => {
  const watermark = coverDetailConfig.value.watermark || {}
  const text = String(watermark.text || '').trim()

  return watermark.enabled && text ? text : ''
})
const coverWatermarkClass = computed(() => (
  `article-detail-cover-watermark-${coverDetailConfig.value.watermark?.position || 'bottom-right'}`
))
const coverWatermarkStyle = computed(() => ({
  opacity: coverDetailConfig.value.watermark?.opacity ?? 0.72
}))
const articleLicense = computed(() => {
  const license = article.value?.licenseDisabled
    ? null
    : article.value?.license || configStore.defaultLicense

  if (!license || typeof license !== 'object') {
    return null
  }

  const name = String(license.name || '').trim()
  const url = String(license.url || '').trim()

  if (!name && !url) {
    return null
  }

  return {
    name: name || url,
    url,
    external: /^(https?:\/\/|mailto:|tel:)/i.test(url)
  }
})

usePageMetadata({
  title: () => {
    if (article.value?.title) return article.value.title
    if (hasResolved.value && !article.value) return '文章未找到'
    return '文章详情'
  },
  type: 'article',
  image: () => articleCover.value || '',
  keywords: () => [
    article.value?.category?.name || '',
    ...((Array.isArray(article.value?.tags) ? article.value.tags : []).map(tag => tag?.name || ''))
  ],
  description: () => (
    article.value?.description
    || article.value?.summary
    || article.value?.excerpt
    || (hasResolved.value && !article.value ? '该文章可能已被删除或链接无效。' : '查看文章详情内容。')
  )
})

// 监听路由参数变化，支持同组件内跳转
watch(articleId, async (newId, oldId) => {
  if (!newId) {
    activeRequestId += 1
    article.value = null
    relatedArticles.value = []
    loading.value = false
    hasResolved.value = true
    return
  }

  await fetchArticleDetail(String(newId))

  if (oldId && newId !== oldId && typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}, { immediate: true })

// 获取文章详情
async function fetchArticleDetail(id) {
  const requestId = ++activeRequestId
  article.value = null
  relatedArticles.value = []
  loading.value = true
  hasResolved.value = false

  try {
    const [articleData, relatedData] = await Promise.all([
      articleStore.fetchArticleDetail(id),
      articleStore.fetchRelatedArticles(id, 3)
    ])

    if (requestId !== activeRequestId) {
      return
    }

    article.value = articleData || null
    relatedArticles.value = Array.isArray(relatedData) ? relatedData : []
  } catch (error) {
    if (requestId !== activeRequestId) {
      return
    }

    console.error('获取文章详情失败:', error)
    article.value = null
    relatedArticles.value = []
  } finally {
    if (requestId === activeRequestId) {
      loading.value = false
      hasResolved.value = true
    }
  }
}

// 格式化日期（容错处理）
const formatDate = (dateString) => {
  if (!dateString) return '未知日期'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '未知日期'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function normalizeCoverWatermark(watermark = {}) {
  if (!watermark || typeof watermark !== 'object') {
    return {
      enabled: false,
      text: '',
      position: 'bottom-right',
      opacity: 0.72
    }
  }

  const position = ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(watermark.position)
    ? watermark.position
    : 'bottom-right'
  const opacity = Number.parseFloat(watermark.opacity)

  return {
    enabled: watermark.enabled === true,
    text: String(watermark.text || '').trim(),
    position,
    opacity: Number.isFinite(opacity) ? Math.min(Math.max(opacity, 0), 1) : 0.72
  }
}
</script>

<style scoped>
.article-detail-view-with-page-background {
  position: relative;
  isolation: isolate;
  margin: -1rem;
  padding: clamp(1rem, 2.4vw, 2rem);
  border-radius: 1.5rem;
  overflow: visible;
  --article-page-background-heading-color: #fff;
  --article-page-background-body-color: rgba(255, 255, 255, 0.92);
  --article-page-background-link-color: rgba(191, 219, 254, 0.98);
  --article-page-background-link-hover-color: #fff;
  --article-page-background-code-color: rgba(219, 234, 254, 0.98);
  --article-page-background-quote-color: rgba(219, 234, 254, 0.86);
  --article-page-background-quote-bg: rgba(15, 23, 42, 0.18);
  --article-page-background-quote-border: rgba(255, 255, 255, 0.38);
  --article-page-background-text-blend-mode: difference;
  --article-page-background-text-shadow: none;
  --article-page-background-heading-shadow: none;
}

.article-detail-page-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  pointer-events: none;
}

.article-detail-page-background::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.46) 0%, rgba(15, 23, 42, 0.28) 18rem, rgba(248, 250, 252, 0.04) 34rem, rgba(248, 250, 252, 0.06) 100%),
    radial-gradient(circle at 18% 8%, rgba(255, 255, 255, 0.08), transparent 30%);
}

.article-detail-view-with-page-background .article-detail-shell {
  position: relative;
  z-index: 1;
}

.article-detail-view-with-page-background .article-detail-header {
  padding-top: clamp(2rem, 8vw, 6rem);
}

.article-detail-view-with-page-background :deep(.article-detail-category) {
  border-color: rgba(255, 255, 255, 0.44);
  background: rgba(255, 255, 255, 0.22);
  color: #fff !important;
  box-shadow: none;
  backdrop-filter: blur(12px);
}

.article-detail-view-with-page-background .article-detail-title {
  color: #fff !important;
  text-shadow: 0 3px 24px rgba(0, 0, 0, 0.5);
}

.article-detail-view-with-page-background .article-detail-meta,
.article-detail-view-with-page-background .article-detail-meta-item {
  color: rgba(255, 255, 255, 0.92) !important;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.42);
}

.article-detail-view-with-page-background .article-detail-meta-item svg,
.article-detail-view-with-page-background .article-detail-meta-item span {
  color: inherit !important;
}

.article-detail-view-with-page-background .article-detail-content {
  padding: clamp(1.25rem, 3vw, 2.25rem);
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 1.5rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02)),
    rgba(255, 255, 255, 0.015);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 24px 90px rgba(15, 23, 42, 0.1);
  color: var(--article-page-background-body-color, rgba(255, 255, 255, 0.92)) !important;
  text-shadow: var(--article-page-background-text-shadow, 0 2px 18px rgba(0, 0, 0, 0.34));
  backdrop-filter: blur(8px) saturate(1.18);
  -webkit-backdrop-filter: blur(8px) saturate(1.18);
}

.article-detail-view-with-page-background .article-detail-content :deep(h1),
.article-detail-view-with-page-background .article-detail-content :deep(h2),
.article-detail-view-with-page-background .article-detail-content :deep(h3),
.article-detail-view-with-page-background .article-detail-content :deep(h4),
.article-detail-view-with-page-background .article-detail-content :deep(h5),
.article-detail-view-with-page-background .article-detail-content :deep(h6),
.article-detail-view-with-page-background .article-detail-content :deep(strong) {
  color: var(--article-page-background-heading-color, #fff) !important;
  mix-blend-mode: var(--article-page-background-text-blend-mode, normal);
  text-shadow: var(--article-page-background-heading-shadow, 0 2px 18px rgba(0, 0, 0, 0.42));
}

.article-detail-view-with-page-background .article-detail-content :deep(p),
.article-detail-view-with-page-background .article-detail-content :deep(li),
.article-detail-view-with-page-background .article-detail-content :deep(td),
.article-detail-view-with-page-background .article-detail-content :deep(th) {
  color: var(--article-page-background-body-color, rgba(255, 255, 255, 0.9)) !important;
  mix-blend-mode: var(--article-page-background-text-blend-mode, normal);
}

.article-detail-view-with-page-background .article-detail-content :deep(a) {
  color: var(--article-page-background-link-color, rgba(191, 219, 254, 0.98)) !important;
  text-decoration-color: color-mix(in srgb, var(--article-page-background-link-color, rgba(191, 219, 254, 0.98)) 48%, transparent);
}

.article-detail-view-with-page-background .article-detail-content :deep(a:hover) {
  color: var(--article-page-background-link-hover-color, #fff) !important;
}

.article-detail-view-with-page-background .article-detail-content :deep(blockquote) {
  color: var(--article-page-background-quote-color, rgba(255, 255, 255, 0.82)) !important;
  background: var(--article-page-background-quote-bg, rgba(15, 23, 42, 0.18)) !important;
  border-left-color: var(--article-page-background-quote-border, rgba(255, 255, 255, 0.38)) !important;
}

.article-detail-view-with-page-background .article-detail-content :deep(code:not(pre code)) {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08) !important;
  color: var(--article-page-background-code-color, rgba(219, 234, 254, 0.98)) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 8px 22px rgba(37, 99, 235, 0.08);
  backdrop-filter: blur(6px) saturate(1.12);
  -webkit-backdrop-filter: blur(6px) saturate(1.12);
}

:global(.dark) .article-detail-page-background::after {
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.48) 0%, rgba(2, 6, 23, 0.3) 18rem, rgba(2, 6, 23, 0.22) 34rem, rgba(2, 6, 23, 0.3) 100%),
    radial-gradient(circle at 18% 8%, rgba(255, 255, 255, 0.06), transparent 30%);
}

:global(.dark) .article-detail-view-with-page-background .article-detail-content {
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.16), rgba(15, 23, 42, 0.04)),
    rgba(15, 23, 42, 0.02);
  border-color: rgba(226, 232, 240, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 24px 90px rgba(0, 0, 0, 0.22);
}

:global(.dark) .article-detail-view-with-page-background .article-detail-content :deep(code:not(pre code)) {
  border-color: rgba(147, 197, 253, 0.16);
  background: rgba(15, 23, 42, 0.1) !important;
}

.article-detail-header-with-background {
  position: relative;
  min-height: clamp(18rem, 42vw, 30rem);
  overflow: hidden;
  border-radius: 1.25rem;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  display: flex;
  align-items: flex-end;
  padding: clamp(1.5rem, 4vw, 3rem);
  color: #fff;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
}

.article-detail-header-background-overlay {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.24) 0%, rgba(15, 23, 42, 0.58) 46%, rgba(15, 23, 42, 0.9) 100%),
    radial-gradient(circle at 16% 18%, rgba(255, 255, 255, 0.16), transparent 34%);
  pointer-events: none;
}

.article-detail-header-content {
  position: relative;
  z-index: 1;
  width: min(100%, 48rem);
}

.article-detail-header-with-background :deep(.article-detail-category) {
  border-color: rgba(255, 255, 255, 0.42);
  background: rgba(255, 255, 255, 0.18);
  color: #fff !important;
  box-shadow: none;
  backdrop-filter: blur(12px);
}

.article-detail-header-with-background .article-detail-title {
  color: #fff !important;
  text-shadow: 0 3px 22px rgba(0, 0, 0, 0.46);
}

.article-detail-header-with-background .article-detail-meta {
  color: rgba(255, 255, 255, 0.9) !important;
}

.article-detail-header-with-background .article-detail-meta-item {
  color: rgba(255, 255, 255, 0.9) !important;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.36);
}

.article-detail-header-with-background .article-detail-meta-item svg,
.article-detail-header-with-background .article-detail-meta-item span {
  color: inherit !important;
}

@media (max-width: 640px) {
  .article-detail-view-with-page-background {
    margin: -0.75rem;
    padding: 0.75rem;
    border-radius: 1.25rem;
  }

  .article-detail-view-with-page-background .article-detail-header {
    padding-top: 4rem;
  }

  .article-detail-view-with-page-background .article-detail-content {
    padding: 1rem;
    border-radius: 1rem;
  }

  .article-detail-header-with-background {
    min-height: 16rem;
    border-radius: 1rem;
    padding: 1.25rem;
  }
}

.article-detail-cover-placeholder {
  display: flex;
  min-height: 16rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.75rem;
  color: rgb(37 99 235);
  background:
    radial-gradient(circle at 18% 18%, rgba(191, 219, 254, 0.82), transparent 34%),
    linear-gradient(135deg, rgba(239, 246, 255, 0.96), rgba(248, 250, 252, 0.96));
}

.article-detail-cover-placeholder[data-placeholder='icon'] {
  color: rgb(148 163 184);
  background: rgba(248, 250, 252, 0.96);
}

:global(.dark) .article-detail-cover-placeholder {
  color: rgb(147 197 253);
  background:
    radial-gradient(circle at 18% 18%, rgba(30, 64, 175, 0.42), transparent 34%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.86));
}

:global(.dark) .article-detail-cover-placeholder[data-placeholder='icon'] {
  color: rgb(100 116 139);
  background: rgba(15, 23, 42, 0.9);
}

.article-detail-cover-watermark {
  position: absolute;
  z-index: 2;
  max-width: min(75%, 24rem);
  padding: 0.42rem 0.72rem;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.58);
  color: white;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0.04em;
  backdrop-filter: blur(10px);
  pointer-events: none;
}

.article-detail-cover-watermark-top-left {
  top: 1rem;
  left: 1rem;
}

.article-detail-cover-watermark-top-right {
  top: 1rem;
  right: 1rem;
}

.article-detail-cover-watermark-bottom-left {
  bottom: 1rem;
  left: 1rem;
}

.article-detail-cover-watermark-bottom-right {
  right: 1rem;
  bottom: 1rem;
}
</style>
