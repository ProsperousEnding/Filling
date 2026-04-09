<template>
  <div class="menu-page-item-view">
    <div v-if="loading" class="theme-empty-state py-12 text-center">
      <p class="theme-empty-text">内容加载中...</p>
    </div>

    <div v-else-if="page && item" class="menu-page-item-shell">
      <header class="menu-page-item-header mb-8">
        <router-link :to="page.path" class="menu-page-item-parent">
          {{ page.title }}
        </router-link>
        <h1 class="theme-page-title text-3xl font-bold mt-3 mb-4">
          {{ item.title }}
        </h1>
        <p v-if="item.meta" class="menu-page-item-meta">{{ item.meta }}</p>
        <p v-if="item.description" class="theme-page-description mt-4">
          {{ item.description }}
        </p>
      </header>

      <div
        v-if="item.contentHtml"
        class="article-content prose prose-lg dark:prose-invert max-w-none"
        v-html="item.contentHtml"
      ></div>

      <div v-else class="theme-empty-state py-8 text-center">
        <p class="theme-empty-text">这个条目还没有正文内容。</p>
      </div>
    </div>

    <div v-else class="theme-empty-state py-12 text-center">
      <h2 class="theme-empty-title text-xl font-bold mb-2">条目未找到</h2>
      <p class="theme-empty-text mb-6">当前目录里没有找到对应内容。</p>
      <router-link v-if="page" :to="page.path" class="menu-page-item-parent-link">
        返回 {{ page.title }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { loadMenuPageItemDetail } from '../adapters/markdown/menuPageSourceService'
import { usePageMetadata } from '../composables/usePageMetadata'
import { useConfigStore } from '../stores/config'
import { resolveMenuPage } from '../utils/menuConfig'

const route = useRoute()
const configStore = useConfigStore()

const itemId = computed(() => String(route.params.itemId || '').trim())
const page = computed(() => {
  const menuPageKey = String(route.meta?.menuPageKey || '').trim()

  if (menuPageKey) {
    return resolveMenuPage(menuPageKey, configStore.menus, configStore.routePatterns)
  }

  return null
})

const item = ref(null)
const loading = ref(false)

let activeRequestId = 0

watch([page, itemId], async ([nextPage, nextItemId], [previousPage, previousItemId]) => {
  const requestId = ++activeRequestId
  item.value = null

  if (!nextPage || !nextItemId) {
    loading.value = false
    return
  }

  loading.value = true

  try {
    const resolvedItem = await loadMenuPageItemDetail(nextPage, nextItemId)

    if (requestId !== activeRequestId) {
      return
    }

    item.value = resolvedItem || null
  } finally {
    if (requestId === activeRequestId) {
      loading.value = false
    }
  }

  if (
    previousPage?.key === nextPage?.key
    && previousItemId
    && previousItemId !== nextItemId
    && typeof window !== 'undefined'
  ) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}, { immediate: true })

usePageMetadata({
  title: () => item.value?.title || page.value?.title || '页面',
  description: () => item.value?.detailDescription || item.value?.description || page.value?.description || ''
})
</script>

<style scoped>
.menu-page-item-parent,
.menu-page-item-parent-link {
  color: rgb(37 99 235);
  text-decoration: none;
  font-weight: 600;
}

.menu-page-item-parent:hover,
.menu-page-item-parent-link:hover {
  text-decoration: underline;
}
</style>
