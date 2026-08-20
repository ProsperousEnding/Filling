<template>
  <div class="built-in-menu-page">
    <div class="theme-page-header mb-8">
      <h1 class="theme-page-title text-3xl font-bold mb-4">
        {{ displayTitle }}
      </h1>
      <p v-if="baseDescription" class="theme-page-description">
        {{ baseDescription }}
      </p>
      <div v-if="layoutSwitcherVisible" class="built-in-page-toolbar">
        <CollectionLayoutSwitcher
          v-model="layoutModel"
          :options="collectionLayout.availableLayouts"
        />
      </div>
    </div>

    <CollectionStatus
      :loading="loading"
      :ready="ready"
      :error="error"
      loading-text="正在加载文章..."
      @retry="refresh"
    />

    <component
      v-if="ready"
      :is="resolvedComponent"
      :page="resolvedPage"
    />

    <Pagination
      v-if="ready && !loading"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="total"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CollectionStatus from '../components/core/CollectionStatus.vue'
import CollectionLayoutSwitcher from '../components/core/CollectionLayoutSwitcher.vue'
import Pagination from '../components/core/Pagination.vue'
import { useArticleStore } from '../stores/article'
import { useConfigStore } from '../stores/config'
import { useBuiltInPageLayout } from '../composables/useBuiltInPageLayout'
import { usePaginatedCollection } from '../composables/usePaginatedCollection'
import { usePageMetadata } from '../composables/usePageMetadata'
import { getArticlesRoute } from '../utils/routeLinks'
import { createArticleCollectionItems, createCollectionPage } from '../utils/pageCollectionItems'
import { resolveMenuPage } from '../utils/menuConfig'
import { resolveBuiltInPageComponent } from './pageComponentRegistry'

const articleStore = useArticleStore()
const configStore = useConfigStore()

const defaultPageSize = computed(() => configStore.pageSize || 10)
const pageConfig = computed(() => (
  resolveMenuPage('articles', configStore.menus, configStore.routePatterns)
))
const pageTitle = computed(() => pageConfig.value?.title || '所有文章')
const displayTitle = computed(() => (
  currentPage.value > 1 ? `${pageTitle.value} · 第 ${currentPage.value} 页` : pageTitle.value
))
const baseDescription = computed(() => (
  pageConfig.value?.description || configStore.blogDescription || '浏览站点全部文章列表。'
))
const {
  collectionLayout,
  currentLayout,
  modelValue: layoutModel,
  switcherVisible: layoutSwitcherVisible
} = useBuiltInPageLayout('articles', () => pageConfig.value?.component)
const resolvedComponent = computed(() => resolveBuiltInPageComponent('articles', currentLayout.value))
const resolvedPage = computed(() => createCollectionPage({
  key: 'articles',
  title: displayTitle.value,
  description: baseDescription.value,
  items: createArticleCollectionItems(articles.value),
  emptyText: '这里还没有文章。',
  layout: collectionLayout.value
}))

const {
  items: articles,
  total,
  loading,
  ready,
  error,
  currentPage,
  totalPages,
  handlePageChange,
  refresh
} = usePaginatedCollection({
  pageSize: defaultPageSize,
  resolvePageRoute: ({ page }) => getArticlesRoute(page),
  fetchPage: ({ page, pageSize: size }) => articleStore.fetchArticles({
    page,
    pageSize: size
  })
})

usePageMetadata({
  title: () => currentPage.value > 1 ? `${pageTitle.value} - 第 ${currentPage.value} 页` : pageTitle.value,
  description: () => currentPage.value > 1
    ? `${baseDescription.value} 第 ${currentPage.value} 页。`
    : baseDescription.value
})
</script>
