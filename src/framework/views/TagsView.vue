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
        加载标签...
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
import { useTagStore } from '../stores/tag'
import { useConfigStore } from '../stores/config'
import { usePageMetadata } from '../composables/usePageMetadata'
import { createCollectionPage, createTagCollectionItems } from '../utils/pageCollectionItems'
import { resolveMenuPage } from '../utils/menuConfig'
import { resolveBuiltInPageComponent } from './pageComponentRegistry'

const tagStore = useTagStore()
const configStore = useConfigStore()

const tags = ref([])
const loading = ref(false)

const pageConfig = computed(() => (
  resolveMenuPage('tags', configStore.menus, configStore.routePatterns)
))
const pageTitle = computed(() => pageConfig.value?.title || '内容标签')
const pageDescription = computed(() => (
  pageConfig.value?.description || '浏览所有内容标签，快速定位你感兴趣的话题'
))
const {
  collectionLayout,
  currentLayout,
  modelValue: layoutModel,
  switcherVisible: layoutSwitcherVisible
} = useBuiltInPageLayout('tags', () => pageConfig.value?.component)
const resolvedComponent = computed(() => resolveBuiltInPageComponent('tags', currentLayout.value))
const resolvedPage = computed(() => createCollectionPage({
  key: 'tags',
  title: pageTitle.value,
  description: pageDescription.value,
  items: createTagCollectionItems(tags.value),
  emptyText: '目前还没有标签。',
  layout: collectionLayout.value
}))

usePageMetadata({
  title: () => pageTitle.value,
  description: () => pageDescription.value
})

onMounted(async () => {
  await fetchTags()
})

async function fetchTags() {
  loading.value = true
  try {
    const result = await tagStore.fetchTags()
    tags.value = result || []
  } catch (error) {
    console.error('获取标签列表失败:', error)
    tags.value = []
  } finally {
    loading.value = false
  }
}
</script>
