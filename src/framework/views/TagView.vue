<template>
  <div class="built-in-menu-page tag-view">
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
      <!-- 标签标题 -->
      <div class="theme-page-header mb-8">
        <h1 class="theme-page-title text-3xl font-bold mb-2">
          <span class="theme-badge px-3 py-1 rounded-full text-sm font-medium">
            # {{ tag ? tag.name : '标签' }}
          </span>
        </h1>
        <p class="theme-page-description mt-4" v-if="pageDescription">
          {{ pageDescription }}
        </p>
      </div>

      <component
        :is="resolvedComponent"
        :page="resolvedPage"
      />

      <div class="mt-8" v-if="totalPages > 1">
        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          @page-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTagStore } from '../stores/tag'
import { useConfigStore } from '../stores/config'
import Pagination from '../components/core/Pagination.vue'
import { usePaginatedCollection } from '../composables/usePaginatedCollection'
import { usePageMetadata } from '../composables/usePageMetadata'
import { createCollectionPage, createContentCollectionItems } from '../utils/pageCollectionItems'
import { resolveMenuPage } from '../utils/menuConfig'
import { getTagRoute } from '../utils/routeLinks'
import { resolveBuiltInPageComponent } from './pageComponentRegistry'

const route = useRoute()
const tagId = computed(() => String(route.params.id || ''))

const tagStore = useTagStore()
const configStore = useConfigStore()
const defaultPageSize = computed(() => configStore.pageSize || 10)
const articlesPageConfig = computed(() => (
  resolveMenuPage('articles', configStore.menus, configStore.routePatterns)
))
const resolvedComponent = computed(() => (
  resolveBuiltInPageComponent('articles', articlesPageConfig.value?.component)
))

const tag = ref(null)

async function fetchTag() {
  if (!tagId.value) {
    tag.value = null
    return
  }

  try {
    const tagData = await tagStore.fetchTagDetail(tagId.value)
    tag.value = tagData
  } catch (error) {
    console.error('获取标签信息失败:', error)
    tag.value = null
  }
}

watch(tagId, () => {
  fetchTag().catch(() => {})
}, { immediate: true })

const {
  items,
  total,
  loading,
  currentPage,
  pageSize,
  handlePageChange
} = usePaginatedCollection({
  pageSize: defaultPageSize,
  watchSources: [tagId],
  resolvePageRoute: ({ page }) => getTagRoute(tagId.value, page),
  fetchPage: ({ page, pageSize: size }) => {
    if (!tagId.value) {
      return { data: [], total: 0 }
    }

    return tagStore.fetchTagArticles(tagId.value, {
      page,
      pageSize: size
    })
  }
})

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const pageDescription = computed(() => {
  if (tag.value?.description) {
    return currentPage.value > 1
      ? `${tag.value.description} · 第 ${currentPage.value} 页`
      : tag.value.description
  }

  if (!tag.value?.name) {
    return ''
  }

  const count = Number(total.value || tag.value?.count || tag.value?.articleCount || 0)
  return currentPage.value > 1
    ? `标签 #${tag.value.name} 下共 ${count} 项内容，第 ${currentPage.value} 页。`
    : `标签 #${tag.value.name} 下共 ${count} 项内容。`
})
const resolvedPage = computed(() => createCollectionPage({
  key: `tag-${tagId.value}`,
  title: tag.value?.name || '标签',
  description: pageDescription.value,
  items: createContentCollectionItems(items.value),
  emptyText: '这个标签下还没有内容。'
}))

usePageMetadata({
  title: () => {
    const baseTitle = tag.value?.name ? `标签：${tag.value.name}` : '标签'
    return currentPage.value > 1 ? `${baseTitle} - 第 ${currentPage.value} 页` : baseTitle
  },
  description: () => {
    if (tag.value?.description) {
      return currentPage.value > 1
        ? `${tag.value.description} 第 ${currentPage.value} 页。`
        : tag.value.description
    }

    if (tag.value?.name) {
      return currentPage.value > 1
        ? `浏览标签 ${tag.value.name} 下的内容，第 ${currentPage.value} 页。`
        : `浏览标签 ${tag.value.name} 下的内容。`
    }

    return '浏览站点标签内容。'
  }
})
</script> 
