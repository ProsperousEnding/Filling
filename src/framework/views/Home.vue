<template>
  <div class="built-in-menu-page">
    <div class="theme-page-header mb-8">
      <h1 class="theme-page-title text-3xl font-bold mb-4">
        {{ pageTitle }}
      </h1>
      <p v-if="pageDescription" class="theme-page-description">
        {{ pageDescription }}
      </p>
    </div>

    <div v-if="loading" class="py-12 flex justify-center">
      <div class="theme-loading-inline inline-flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        正在加载文章...
      </div>
    </div>

    <component
      v-else
      :is="resolvedComponent"
      :page="resolvedPage"
    />

    <Pagination
      v-if="!loading"
      :current-page="currentPage"
      :total-pages="totalPages"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Pagination from '../components/core/Pagination.vue'
import { useArticleStore } from '../stores/article'
import { useConfigStore } from '../stores/config'
import { usePaginatedCollection } from '../composables/usePaginatedCollection'
import { usePageMetadata } from '../composables/usePageMetadata'
import { createArticleCollectionItems, createCollectionPage } from '../utils/pageCollectionItems'
import { resolveMenuPage } from '../utils/menuConfig'
import { resolveBuiltInPageComponent } from './pageComponentRegistry'

const articleStore = useArticleStore()
const configStore = useConfigStore()

const defaultPageSize = computed(() => configStore.pageSize || 8)
const pageConfig = computed(() => (
  resolveMenuPage('home', configStore.menus, configStore.routePatterns)
))
const pageTitle = computed(() => pageConfig.value?.title || '最新文章')
const pageDescription = computed(() => (
  pageConfig.value?.description || configStore.blogDescription || '浏览站点最新发布的文章内容。'
))
const resolvedComponent = computed(() => resolveBuiltInPageComponent('home', pageConfig.value?.component))
const resolvedPage = computed(() => createCollectionPage({
  key: 'home',
  title: pageTitle.value,
  description: pageDescription.value,
  items: createArticleCollectionItems(articles.value),
  emptyText: '这里还没有文章。'
}))
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

usePageMetadata({
  title: () => pageTitle.value,
  description: () => pageDescription.value
})

const {
  items: articles,
  total,
  loading,
  currentPage,
  pageSize,
  handlePageChange
} = usePaginatedCollection({
  pageSize: defaultPageSize,
  fetchPage: ({ page, pageSize: size }) => articleStore.fetchArticles({
    page,
    pageSize: size
  })
})
</script>
