<template>
  <div class="menu-page-view">
    <template v-if="resolvedPage">
      <div class="theme-page-header mb-8">
        <h1 class="theme-page-title text-3xl font-bold mb-4">
          {{ resolvedPage.title }}
        </h1>
        <p v-if="resolvedPage.description" class="theme-page-description">
          {{ resolvedPage.description }}
        </p>
      </div>

      <div v-if="sourceLoading" class="theme-empty-state py-8 text-center">
        <p class="theme-empty-text">内容加载中...</p>
      </div>

      <component
        v-else
        :is="resolvedComponent"
        :page="resolvedPage"
        :content-blocks="contentBlocks"
      />
    </template>

    <div v-else class="theme-empty-state py-12 text-center">
      <h2 class="theme-empty-title text-xl font-bold mb-2">页面未配置</h2>
      <p class="theme-empty-text">当前菜单没有找到对应的页面配置。</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  loadMenuPageSource,
  menuPageUsesExternalSource,
  menuPageUsesFileSource,
  menuPageUsesFolderSource
} from '../adapters/markdown/menuPageSourceService'
import { useConfigStore } from '../stores/config'
import { resolveMenuPage } from '../utils/menuConfig'
import { usePageMetadata } from '../composables/usePageMetadata'
import { resolveMenuPageComponent, resolveMenuPageComponentKey } from './pageComponentRegistry'

const route = useRoute()
const configStore = useConfigStore()

const page = computed(() => {
  const menuPageKey = String(route.meta?.menuPageKey || '').trim()

  if (menuPageKey) {
    return resolveMenuPage(menuPageKey, configStore.menus, configStore.routePatterns)
  }

  return resolveMenuPage(route.path, configStore.menus, configStore.routePatterns)
})

const resolvedComponentKey = computed(() => resolveMenuPageComponentKey(page.value?.component))

const resolvedComponent = computed(() => (
  resolveMenuPageComponent(resolvedComponentKey.value)
))

const sourceLoading = ref(false)
const loadedPageSource = ref({
  title: '',
  description: '',
  cover: '',
  content: '',
  contentHtml: '',
  items: []
})

let sourceLoadSequence = 0

watch([page, resolvedComponentKey], async ([nextPage, nextComponentKey]) => {
  sourceLoadSequence += 1
  const currentSequence = sourceLoadSequence

  sourceLoading.value = false
  loadedPageSource.value = {
    title: '',
    description: '',
    cover: '',
    content: '',
    contentHtml: '',
    items: []
  }

  if (!menuPageUsesExternalSource(nextPage, nextComponentKey)) {
    return
  }

  sourceLoading.value = true

  try {
    const resolvedSource = await loadMenuPageSource(nextPage, nextComponentKey)

    if (currentSequence !== sourceLoadSequence) {
      return
    }

    loadedPageSource.value = {
      title: resolvedSource?.title || '',
      description: resolvedSource?.description || '',
      cover: resolvedSource?.cover || '',
      content: resolvedSource?.content || '',
      contentHtml: resolvedSource?.contentHtml || '',
      items: Array.isArray(resolvedSource?.items) ? resolvedSource.items : []
    }
  } finally {
    if (currentSequence === sourceLoadSequence) {
      sourceLoading.value = false
    }
  }
}, { immediate: true })

const resolvedPage = computed(() => {
  if (!page.value) {
    return null
  }

  const nextPage = {
    ...page.value,
    contentHtml: '',
    items: Array.isArray(page.value.items) ? page.value.items : []
  }

  if (menuPageUsesFileSource(page.value, resolvedComponentKey.value)) {
    nextPage.content = loadedPageSource.value.content
    nextPage.contentHtml = loadedPageSource.value.contentHtml
    nextPage.cover = nextPage.cover || loadedPageSource.value.cover
    nextPage.description = nextPage.description || loadedPageSource.value.description
  }

  if (menuPageUsesFolderSource(page.value, resolvedComponentKey.value)) {
    nextPage.items = loadedPageSource.value.items
  }

  return nextPage
})

const contentBlocks = computed(() => (
  String(resolvedPage.value?.content || '')
    .trim()
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
))

usePageMetadata({
  title: () => resolvedPage.value?.title || '页面',
  description: () => resolvedPage.value?.description || contentBlocks.value[0] || '',
  image: () => resolvedPage.value?.cover || resolvedPage.value?.image || ''
})
</script>
