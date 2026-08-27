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
import { useTagStore } from '../stores/tag'
import { useConfigStore } from '../stores/config'
import { usePageMetadata } from '../composables/usePageMetadata'
import { createCollectionPage, createTagCollectionItems } from '../utils/pageCollectionItems'
import { resolveMenuPage } from '../utils/menuConfig'
import TaxonomyIndexPage from './pageComponents/TaxonomyIndexPage.vue'
import { applyMaybeAsync } from '../utils/asyncValue'

const tagStore = useTagStore()
const configStore = useConfigStore()

const tags = ref([])

const pageConfig = computed(() => (
  resolveMenuPage('tags', configStore.menus, configStore.routePatterns)
))
const pageTitle = computed(() => pageConfig.value?.title || '内容标签')
const pageDescription = computed(() => (
  pageConfig.value?.description || '浏览所有内容标签，快速定位你感兴趣的话题'
))
const {
  collectionLayout
} = useBuiltInPageLayout('tags', () => pageConfig.value?.component)
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

const initialTagsRequest = fetchTags()
onServerPrefetch(() => initialTagsRequest)

function fetchTags() {
  try {
    return applyMaybeAsync(tagStore.fetchTags(), (result) => {
      tags.value = result || []
    }).catch((error) => {
      console.error('获取标签列表失败:', error)
      tags.value = []
    })
  } catch (error) {
    console.error('获取标签列表失败:', error)
    tags.value = []
    return Promise.resolve()
  }
}
</script>
