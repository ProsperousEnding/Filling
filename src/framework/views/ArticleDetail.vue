<template>
  <div class="article-detail-view">
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
      <header class="article-detail-header mb-8">
        <!-- 分类 -->
        <div class="mb-4" v-if="article.category">
          <router-link :to="getCategoryRoute(article.category)" class="article-detail-category">
            {{ typeof article.category === 'string' ? article.category : article.category.name }}
          </router-link>
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
      </header>

      <!-- 封面图 -->
      <div v-if="article.cover" class="article-detail-cover mb-8">
        <img
          :src="article.cover"
          :alt="article.title"
          class="w-full h-auto rounded-lg"
        />
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
          <router-link
            v-for="tag in article.tags"
            :key="typeof tag === 'string' ? tag : tag.id"
            :to="getTagRoute(tag)"
            class="tag"
          >
            {{ typeof tag === 'string' ? tag : tag.name }}
          </router-link>
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
                v-if="related.cover"
                :src="related.cover"
                :alt="related.title"
                class="article-detail-related-image w-full h-40 object-cover"
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
const articleLicense = computed(() => {
  const license = article.value?.license

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
</script>
