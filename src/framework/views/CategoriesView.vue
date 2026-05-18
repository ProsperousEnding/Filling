<template>
  <div class="built-in-menu-page">
    <div class="theme-page-header mb-8">
      <h1 class="theme-page-title text-3xl font-bold mb-4">{{ pageTitle }}</h1>
      <p class="theme-page-description">{{ pageDescription }}</p>
      <div v-if="layoutSwitcherVisible" class="built-in-page-toolbar">
        <CollectionLayoutSwitcher
          v-model="layoutModel"
          :options="collectionLayout.availableLayouts"
        />
      </div>
    </div>

    <div v-if="loading" class="py-12 flex justify-center">
      <div class="theme-loading-inline inline-flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        加载分类...
      </div>
    </div>

    <component
      v-else
      :is="resolvedComponent"
      :page="resolvedPage"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import CollectionLayoutSwitcher from '../components/core/CollectionLayoutSwitcher.vue'
import { useBuiltInPageLayout } from '../composables/useBuiltInPageLayout'
import { useCategoryStore } from '../stores/category'
import { useConfigStore } from '../stores/config'
import { usePageMetadata } from '../composables/usePageMetadata'
import { createCategoryCollectionItems, createCollectionPage } from '../utils/pageCollectionItems'
import { resolveMenuPage } from '../utils/menuConfig'
import { resolveBuiltInPageComponent } from './pageComponentRegistry'

const categoryStore = useCategoryStore()
const configStore = useConfigStore()

const categories = ref([])
const loading = ref(false)

const pageConfig = computed(() => (
  resolveMenuPage('categories', configStore.menus, configStore.routePatterns)
))
const pageTitle = computed(() => pageConfig.value?.title || '内容分类')
const pageDescription = computed(() => (
  pageConfig.value?.description || '浏览所有内容分类，发现你感兴趣的主题'
))
const {
  collectionLayout,
  currentLayout,
  modelValue: layoutModel,
  switcherVisible: layoutSwitcherVisible
} = useBuiltInPageLayout('categories', () => pageConfig.value?.component)
const resolvedComponent = computed(() => resolveBuiltInPageComponent('categories', currentLayout.value))
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

onMounted(async () => {
  await fetchCategories()
})

async function fetchCategories() {
  loading.value = true
  try {
    const result = await categoryStore.fetchCategories()
    categories.value = result || []
  } catch (error) {
    console.error('获取分类列表失败:', error)
    categories.value = []
  } finally {
    loading.value = false
  }
}
</script>
