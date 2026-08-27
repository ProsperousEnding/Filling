<template>
  <div class="built-in-menu-page">
    <div class="theme-page-header mb-8">
      <h1 class="theme-page-title text-3xl font-bold mb-4">{{ pageTitle }}</h1>
      <p class="theme-page-description">{{ pageDescription }}</p>
    </div>

    <TaxonomyIndexPage
      :page="resolvedPage"
    />
  </div>
</template>

<script setup>
import { computed, onServerPrefetch, ref } from 'vue'
import { useBuiltInPageLayout } from '../composables/useBuiltInPageLayout'
import { useCategoryStore } from '../stores/category'
import { useConfigStore } from '../stores/config'
import { usePageMetadata } from '../composables/usePageMetadata'
import { createCategoryCollectionItems, createCollectionPage } from '../utils/pageCollectionItems'
import { resolveMenuPage } from '../utils/menuConfig'
import TaxonomyIndexPage from './pageComponents/TaxonomyIndexPage.vue'
import { applyMaybeAsync } from '../utils/asyncValue'

const categoryStore = useCategoryStore()
const configStore = useConfigStore()

const categories = ref([])

const pageConfig = computed(() => (
  resolveMenuPage('categories', configStore.menus, configStore.routePatterns)
))
const pageTitle = computed(() => pageConfig.value?.title || '内容分类')
const pageDescription = computed(() => (
  pageConfig.value?.description || '浏览所有内容分类，发现你感兴趣的主题'
))
const {
  collectionLayout
} = useBuiltInPageLayout('categories', () => pageConfig.value?.component)
const resolvedPage = computed(() => createCollectionPage({
  key: 'categories',
  title: pageTitle.value,
  description: pageDescription.value,
  items: createCategoryCollectionItems(categories.value),
  emptyText: '目前还没有分类。',
  layout: collectionLayout.value
}))

usePageMetadata({
  title: () => pageTitle.value,
  description: () => pageDescription.value
})

const initialCategoriesRequest = fetchCategories()
onServerPrefetch(() => initialCategoriesRequest)

function fetchCategories() {
  try {
    return applyMaybeAsync(categoryStore.fetchCategories(), (result) => {
      categories.value = result || []
    }).catch((error) => {
      console.error('获取分类列表失败:', error)
      categories.value = []
    })
  } catch (error) {
    console.error('获取分类列表失败:', error)
    categories.value = []
    return Promise.resolve()
  }
}
</script>
