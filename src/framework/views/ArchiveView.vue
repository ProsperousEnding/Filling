<template>
  <div class="built-in-menu-page">
    <div class="theme-page-header mb-8">
      <h1 class="theme-page-title text-3xl font-bold mb-4">{{ pageTitle }}</h1>
      <p class="theme-page-description">{{ pageDescription }}</p>
    </div>

    <div v-if="loading" class="py-12 flex justify-center">
      <div class="theme-loading-inline inline-flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        加载归档...
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
import { useRoute } from 'vue-router'
import { useArticleStore } from '../stores/article'
import { useConfigStore } from '../stores/config'
import { usePageMetadata } from '../composables/usePageMetadata'
import {
  createArchiveOverviewItems,
  createContentCollectionItems,
  createCollectionPage
} from '../utils/pageCollectionItems'
import { resolveMenuPage } from '../utils/menuConfig'
import { resolveBuiltInPageComponent } from './pageComponentRegistry'

const route = useRoute()
const articleStore = useArticleStore()
const configStore = useConfigStore()

const archiveGroups = ref([])
const loading = ref(false)

const selectedYear = computed(() => {
  const rawYear = Array.isArray(route.params.year) ? route.params.year[0] : route.params.year
  const parsedYear = Number.parseInt(String(rawYear || ''), 10)

  return Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : null
})

const pageConfig = computed(() => (
  resolveMenuPage('archive', configStore.menus, configStore.routePatterns)
))
const resolvedComponent = computed(() => resolveBuiltInPageComponent('archive', pageConfig.value?.component))
const hasSelectedYear = computed(() => selectedYear.value !== null)
const selectedArchiveGroup = computed(() => (
  archiveGroups.value.find(group => Number(group?.year) === selectedYear.value) || null
))
const selectedEntries = computed(() => (
  Array.isArray(selectedArchiveGroup.value?.articles) ? selectedArchiveGroup.value.articles : []
))
const baseTitle = computed(() => pageConfig.value?.title || '内容归档')
const baseDescription = computed(() => (
  pageConfig.value?.description || '按年份浏览站点全部归档内容。'
))
const pageTitle = computed(() => (
  hasSelectedYear.value ? `${selectedYear.value} 年归档` : baseTitle.value
))
const pageDescription = computed(() => (
  hasSelectedYear.value
    ? `浏览 ${selectedYear.value} 年发布的归档内容。`
    : baseDescription.value
))
const resolvedPage = computed(() => createCollectionPage({
  key: 'archive',
  title: pageTitle.value,
  description: pageDescription.value,
  items: hasSelectedYear.value
    ? createContentCollectionItems(selectedEntries.value)
    : createArchiveOverviewItems(archiveGroups.value),
  emptyText: hasSelectedYear.value ? '这一年还没有内容。' : '这里还没有归档内容。'
}))

usePageMetadata({
  title: () => hasSelectedYear.value ? `归档：${selectedYear.value}` : baseTitle.value,
  description: () => pageDescription.value
})

onMounted(async () => {
  await fetchArchiveGroups()
})

async function fetchArchiveGroups() {
  loading.value = true

  try {
    archiveGroups.value = await articleStore.fetchArchiveGroups()
  } catch (error) {
    console.error('获取归档列表失败:', error)
    archiveGroups.value = []
  } finally {
    loading.value = false
  }
}
</script>
