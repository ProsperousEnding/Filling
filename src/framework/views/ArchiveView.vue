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

    <component
      :is="resolvedComponent"
      :page="resolvedPage"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import CollectionLayoutSwitcher from '../components/core/CollectionLayoutSwitcher.vue'
import { useBuiltInPageLayout } from '../composables/useBuiltInPageLayout'
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

const selectedYear = computed(() => {
  const rawYear = Array.isArray(route.params.year) ? route.params.year[0] : route.params.year
  const parsedYear = Number.parseInt(String(rawYear || ''), 10)

  return Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : null
})

const pageConfig = computed(() => (
  resolveMenuPage('archive', configStore.menus, configStore.routePatterns)
))
const {
  collectionLayout,
  currentLayout,
  modelValue: layoutModel,
  switcherVisible: layoutSwitcherVisible
} = useBuiltInPageLayout('archive', () => pageConfig.value?.component)
const resolvedComponent = computed(() => resolveBuiltInPageComponent('archive', currentLayout.value))
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
  emptyText: hasSelectedYear.value ? '这一年还没有内容。' : '这里还没有归档内容。',
  layout: collectionLayout.value
}))

usePageMetadata({
  title: () => hasSelectedYear.value ? `归档：${selectedYear.value}` : baseTitle.value,
  description: () => pageDescription.value
})

fetchArchiveGroups().catch(() => {})

async function fetchArchiveGroups() {
  try {
    archiveGroups.value = await articleStore.fetchArchiveGroups()
  } catch (error) {
    console.error('获取归档列表失败:', error)
    archiveGroups.value = []
  }
}
</script>
