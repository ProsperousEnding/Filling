<template>
  <div class="search-view">
    <!-- 搜索标题 -->
    <div class="theme-page-header mb-8">
      <h1 class="theme-page-title text-3xl font-bold mb-4">
        搜索结果
      </h1>
      <!-- 搜索框 -->
      <div class="mb-6">
        <div class="search-bar-wrap">
          <div class="search-bar" role="search">
            <svg xmlns="http://www.w3.org/2000/svg" class="search-leading-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索内容..."
              class="search-input"
              @keyup.enter="performSearch(true, 1)"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="clearSearch"
              class="search-clear-btn"
              aria-label="清除搜索"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              @click="performSearch(true, 1)"
              :disabled="!trimmedQuery"
              class="search-submit-btn"
              aria-label="搜索"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <!-- 搜索状态 -->
      <div v-if="searchPerformed" class="theme-page-status">
        找到 {{ total }} 条与 "{{ displayQuery }}" 相关的结果
      </div>
    </div>
    
    <!-- 加载中 -->
    <div v-if="loading" class="py-12 flex justify-center">
      <div class="theme-loading-inline inline-flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        搜索中...
      </div>
    </div>
    
    <!-- 搜索结果 -->
    <div v-else-if="searchPerformed">
      <!-- 有结果 -->
      <div v-if="articles.length > 0">
        <div class="space-y-6">
          <SearchResultCard
            v-for="article in articles"
            :key="article.id"
            :article="article"
            :keywords="activeKeywords"
          />
        </div>
        
        <!-- 分页 -->
        <div class="mt-8" v-if="total > pageSize">
          <pagination 
            :current-page="currentPage" 
            :total-pages="totalPages"
            @page-change="handlePageChange"
          />
        </div>
      </div>
      
      <!-- 无结果 -->
      <div v-else class="theme-empty-state py-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="theme-empty-icon h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="theme-empty-title text-xl font-bold mb-2">未找到结果</h2>
        <p class="theme-empty-text mb-6">没有找到与"{{ displayQuery }}"相关的内容</p>
        <p class="theme-empty-text">尝试其他搜索词或浏览下面的热门标签</p>
        
        <!-- 热门标签 -->
        <div class="mt-8">
          <tag-cloud title="热门标签" :tags="suggestedTags" :loading="suggestedTagsLoading" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearchStore } from '../stores/search'
import { useTagStore } from '../stores/tag'
import SearchResultCard from '../components/core/SearchResultCard.vue'
import TagCloud from '../components/core/TagCloud.vue'
import Pagination from '../components/core/Pagination.vue'
import { usePageMetadata } from '../composables/usePageMetadata'
import { getSearchRoute } from '../utils/routeLinks'

// 获取路由参数
const route = useRoute()
const router = useRouter()

// 获取store
const searchStore = useSearchStore()
const tagStore = useTagStore()

// 状态
const searchQuery = ref('')
const trimmedQuery = computed(() => searchQuery.value.trim())
const displayQuery = ref('')
const articles = ref([])
const total = ref(0)
const loading = ref(false)
const searchPerformed = ref(false)
const currentPage = ref(parseInt(route.query.page) || 1)
const pageSize = ref(10)
const suggestedTags = ref([])
const suggestedTagsLoading = ref(false)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const activeSearchQuery = computed(() => displayQuery.value || trimmedQuery.value)
const activeKeywords = computed(() => activeSearchQuery.value.split(/\s+/).filter(Boolean))

usePageMetadata({
  title: () => displayQuery.value ? `搜索：${displayQuery.value}` : '搜索',
  description: () => displayQuery.value
    ? `搜索“${displayQuery.value}”的结果页，共 ${total.value} 条结果。`
    : '搜索站点中的内容。'
})

onMounted(() => {
  loadSuggestedTags().catch(() => {})
})

const syncFromRoute = () => {
  const keyword = (route.query.keyword ?? route.query.q ?? '').toString()
  const page = parseInt(route.query.page) || 1

  if (keyword !== searchQuery.value) {
    searchQuery.value = keyword
  }
  currentPage.value = page

  if (keyword) {
    performSearch(false, page)
  } else {
    searchPerformed.value = false
    displayQuery.value = ''
    articles.value = []
    total.value = 0
  }
}

watch(() => [route.query.keyword, route.query.q, route.query.page], syncFromRoute, { immediate: true })

// 执行搜索
async function performSearch(updateUrl = true, page = currentPage.value) {
  const keyword = trimmedQuery.value
  if (!keyword) return

  if (updateUrl) {
    currentPage.value = page
    const nextQuery = {
      keyword,
      page
    }
    const sameKeyword = route.query.keyword === keyword || route.query.q === keyword
    const samePage = String(route.query.page || '1') === String(page)
    if (!sameKeyword || !samePage) {
      router.push(getSearchRoute(nextQuery))
    }
    return
  }

  loading.value = true
  searchPerformed.value = true
  displayQuery.value = keyword

  try {
    const result = await searchStore.search({
      keyword,
      page,
      pageSize: pageSize.value
    })

    articles.value = result.data || []
    total.value = result.total || 0
  } catch (error) {
    console.error('搜索失败:', error)
    articles.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadSuggestedTags() {
  if (suggestedTagsLoading.value || suggestedTags.value.length > 0) {
    return
  }

  suggestedTagsLoading.value = true

  try {
    const tags = await tagStore.fetchTags()
    suggestedTags.value = (Array.isArray(tags) ? tags : [])
      .slice()
      .sort((a, b) => {
        const countA = Number(a?.articleCount ?? a?.count ?? 0)
        const countB = Number(b?.articleCount ?? b?.count ?? 0)
        return countB - countA || String(a?.name || '').localeCompare(String(b?.name || ''), 'zh-CN')
      })
      .slice(0, 24)
  } catch (error) {
    suggestedTags.value = []
  } finally {
    suggestedTagsLoading.value = false
  }
}

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
  displayQuery.value = ''
  searchPerformed.value = false
  articles.value = []
  total.value = 0
  currentPage.value = 1

  if (route.query.keyword || route.query.q || route.query.page) {
    router.push(getSearchRoute())
  }
}

// 页码变更
const handlePageChange = (page) => {
  currentPage.value = page
  const keyword = activeSearchQuery.value.trim()
  if (!keyword) return

  router.push(getSearchRoute({
    keyword,
    page
  }))

  // 滚动到顶部
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

</script> 


<style scoped>
.search-bar-wrap {
  max-width: 56rem;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 3rem;
  padding: 0.32rem 0.48rem 0.32rem 0.72rem;
  border-radius: 9999px;
  border: 1px solid rgba(147, 197, 253, 0.9);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-bar:focus-within {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.search-leading-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: rgb(148 163 184);
}

.search-input {
  min-width: 0;
  flex: 1;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  appearance: none;
  color: rgb(15 23 42);
  font-size: 0.95rem;
  line-height: 1.35;
  padding: 0.16rem 0.1rem !important;
}

.search-input::placeholder {
  color: rgb(156 163 175);
}

.search-clear-btn,
.search-submit-btn {
  position: static;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin: 0;
  padding: 0 !important;
  border: 0;
  border-radius: 9999px;
  box-shadow: none !important;
  overflow: visible;
  transform: none;
  transition: background-color 0.18s ease, color 0.18s ease, opacity 0.18s ease;
}

.search-clear-btn::after,
.search-submit-btn::after {
  content: none;
}

.search-clear-btn {
  background: transparent;
  color: rgb(148 163 184);
}

.search-clear-btn:hover {
  background: rgb(241 245 249);
  color: rgb(71 85 105);
  transform: none;
}

.search-submit-btn {
  background: rgb(59 130 246);
  color: #fff;
}

.search-submit-btn:hover {
  background: rgb(37 99 235);
  transform: none;
}

.search-submit-btn:focus-visible,
.search-clear-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.24);
}

.search-submit-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.search-submit-btn:disabled:hover {
  background: rgb(59 130 246);
}

.search-icon {
  width: 0.95rem;
  height: 0.95rem;
  pointer-events: none;
}

.dark .search-bar {
  border-color: rgba(96, 165, 250, 0.55);
  background: rgba(31, 41, 55, 0.84);
}

.dark .search-bar:focus-within {
  border-color: rgba(96, 165, 250, 0.9);
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.25);
}

.dark .search-input {
  color: rgb(243 244 246);
}

.dark .search-input::placeholder {
  color: rgb(156 163 175);
}

.dark .search-clear-btn {
  color: rgb(156 163 175);
}

.dark .search-clear-btn:hover {
  background: rgb(55 65 81);
  color: rgb(229 231 235);
}

@media (max-width: 640px) {
  .search-bar {
    min-height: 2.86rem;
    padding: 0.26rem 0.36rem 0.26rem 0.62rem;
    gap: 0.35rem;
  }
}
</style>
