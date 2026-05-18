<template>
  <div class="built-in-menu-page category-view">
    <div v-if="loading" class="py-12 flex justify-center">
      <div class="theme-loading-inline inline-flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        加载中...
      </div>
    </div>
    
    <div v-else>
      <!-- 分类标题 -->
      <div class="theme-page-header mb-8">
        <h1 class="theme-page-title text-3xl font-bold mb-2">
          {{ category ? category.name : '分类' }}
        </h1>
        <p class="theme-page-description" v-if="pageDescription">
          {{ pageDescription }}
        </p>
        <div v-if="layoutSwitcherVisible" class="built-in-page-toolbar">
          <CollectionLayoutSwitcher
            v-model="layoutModel"
            :options="collectionLayout.availableLayouts"
          />
        </div>
      </div>

      <component
        :is="resolvedComponent"
        :page="resolvedPage"
      />

      <div class="mt-8" v-if="totalPages > 1">
        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="total"
          @page-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCategoryStore } from '../stores/category'
import { useConfigStore } from '../stores/config'
import CollectionLayoutSwitcher from '../components/core/CollectionLayoutSwitcher.vue'
import Pagination from '../components/core/Pagination.vue'
import { useBuiltInPageLayout } from '../composables/useBuiltInPageLayout'
import { usePaginatedCollection } from '../composables/usePaginatedCollection'
import { usePageMetadata } from '../composables/usePageMetadata'
import { createCollectionPage, createContentCollectionItems } from '../utils/pageCollectionItems'
import { resolveMenuPage } from '../utils/menuConfig'
import { getCategoryRoute } from '../utils/routeLinks'
import { resolveBuiltInPageComponent } from './pageComponentRegistry'

const route = useRoute()
const categoryId = computed(() => String(route.params.id || ''))

const categoryStore = useCategoryStore()
const configStore = useConfigStore()
const defaultPageSize = computed(() => configStore.pageSize || 10)
const articlesPageConfig = computed(() => (
  resolveMenuPage('articles', configStore.menus, configStore.routePatterns)
))
const {
  collectionLayout,
  currentLayout,
  modelValue: layoutModel,
  switcherVisible: layoutSwitcherVisible
} = useBuiltInPageLayout('articles', () => articlesPageConfig.value?.component)
const resolvedComponent = computed(() => resolveBuiltInPageComponent('articles', currentLayout.value))

const category = ref(null)

async function fetchCategory() {
  if (!categoryId.value) {
    category.value = null
    return
  }

  try {
    const categoryData = await categoryStore.fetchCategoryDetail(categoryId.value)
    category.value = categoryData
  } catch (error) {
    console.error('获取分类信息失败:', error)
    category.value = null
  }
}

watch(categoryId, () => {
  fetchCategory().catch(() => {})
}, { immediate: true })

const {
  items,
  total,
  loading,
  currentPage,
  totalPages,
  handlePageChange
} = usePaginatedCollection({
  pageSize: defaultPageSize,
  watchSources: [categoryId],
  resolvePageRoute: ({ page }) => getCategoryRoute(categoryId.value, page),
  fetchPage: ({ page, pageSize: size }) => {
    if (!categoryId.value) {
      return { data: [], total: 0 }
    }

    return categoryStore.fetchCategoryArticles(categoryId.value, {
      page,
      pageSize: size
    })
  }
})

const pageDescription = computed(() => {
  if (category.value?.description) {
    return currentPage.value > 1
      ? `${category.value.description} · 第 ${currentPage.value} 页`
      : category.value.description
  }

  if (!category.value?.name) {
    return ''
  }

  const count = Number(total.value || category.value?.count || category.value?.articleCount || 0)
  return currentPage.value > 1
    ? `分类 ${category.value.name} 下共 ${count} 项内容，第 ${currentPage.value} 页。`
    : `分类 ${category.value.name} 下共 ${count} 项内容。`
})
const resolvedPage = computed(() => createCollectionPage({
  key: `category-${categoryId.value}`,
  title: category.value?.name || '分类',
  description: pageDescription.value,
  items: createContentCollectionItems(items.value),
  emptyText: '这个分类下还没有内容。',
  layout: collectionLayout.value
}))

usePageMetadata({
  title: () => {
    const baseTitle = category.value?.name ? `分类：${category.value.name}` : '分类'
    return currentPage.value > 1 ? `${baseTitle} - 第 ${currentPage.value} 页` : baseTitle
  },
  description: () => {
    if (category.value?.description) {
      return currentPage.value > 1
        ? `${category.value.description} 第 ${currentPage.value} 页。`
        : category.value.description
    }

    if (category.value?.name) {
      return currentPage.value > 1
        ? `浏览分类 ${category.value.name} 下的内容，第 ${currentPage.value} 页。`
        : `浏览分类 ${category.value.name} 下的内容。`
    }

    return '浏览站点分类内容。'
  }
})
</script> 
