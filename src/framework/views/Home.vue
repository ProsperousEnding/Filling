<template>
  <div class="built-in-menu-page">
    <div class="theme-page-header mb-8">
      <h1 class="theme-page-title text-3xl font-bold mb-4">
        {{ displayTitle }}
      </h1>
      <p v-if="pageDescription" class="theme-page-description">
        {{ pageDescription }}
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
import { useBuiltInPageLayout } from '../composables/useBuiltInPageLayout'
import { useArticleStore } from '../stores/article'
import { useConfigStore } from '../stores/config'
import { usePaginatedCollection } from '../composables/usePaginatedCollection'
import { usePageMetadata } from '../composables/usePageMetadata'
import { createArticleCollectionItems, createCollectionPage } from '../utils/pageCollectionItems'
import { resolveHomeArticlePageTitle } from '../utils/homeArticleSelection'
import { resolveMenuPage } from '../utils/menuConfig'
import { resolveBuiltInPageComponent } from './pageComponentRegistry'

const articleStore = useArticleStore()
const configStore = useConfigStore()

const homeArticleConfig = computed(() => configStore.homeArticleConfig || {})
const defaultPageSize = computed(() => homeArticleConfig.value.pageSize || configStore.pageSize || 8)
const pageConfig = computed(() => (
  resolveMenuPage('home', configStore.menus, configStore.routePatterns)
))
const pageTitle = computed(() => (
  resolveHomeArticlePageTitle(homeArticleConfig.value.mode, configStore.menus)
))
const displayTitle = computed(() => (
  currentPage.value > 1 ? `${pageTitle.value} · 第 ${currentPage.value} 页` : pageTitle.value
))
const pageDescription = computed(() => (
  currentPage.value > 1
    ? `${pageConfig.value?.description || configStore.blogDescription || '浏览站点最新发布的文章内容。'} 第 ${currentPage.value} 页。`
    : (pageConfig.value?.description || configStore.blogDescription || '浏览站点最新发布的文章内容。')
))
const {
  collectionLayout,
  currentLayout,
  modelValue: layoutModel,
  switcherVisible: layoutSwitcherVisible
} = useBuiltInPageLayout('home', () => pageConfig.value?.component)
const resolvedComponent = computed(() => resolveBuiltInPageComponent('home', currentLayout.value))
const resolvedPage = computed(() => createCollectionPage({
  key: 'home',
  title: displayTitle.value,
  description: pageDescription.value,
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
  watchSources: [homeArticleConfig],
  fetchPage: ({ page, pageSize: size }) => articleStore.fetchHomeArticles({
    page,
    pageSize: size,
    config: homeArticleConfig.value
  })
})

usePageMetadata({
  title: () => displayTitle.value,
  description: () => pageDescription.value
})
</script>
