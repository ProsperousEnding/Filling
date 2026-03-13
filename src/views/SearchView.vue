<template>
  <div class="search-view">
    <!-- 搜索标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
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
              placeholder="搜索文章..."
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
      <div v-if="searchPerformed" class="text-gray-600 dark:text-gray-400">
        找到 {{ total }} 条与 "{{ displayQuery }}" 相关的结果
      </div>
    </div>
    
    <!-- 加载中 -->
    <div v-if="loading" class="py-12 flex justify-center">
      <div class="inline-flex items-center text-gray-500">
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
          <div 
            v-for="article in articles" 
            :key="article.id"
            class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex flex-col">
              <!-- 文章标题 -->
              <router-link 
                :to="`/article/${article.id}`" 
                class="text-xl font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 mb-2"
              >
                {{ article.title }}
              </router-link>
              
              <!-- 文章摘要，高亮关键词 -->
              <p class="text-gray-600 dark:text-gray-400 mb-4" v-html="highlightKeywords(article.summary || article.content)"></p>
              
              <!-- 文章元信息 -->
              <div class="flex flex-wrap text-sm text-gray-500 dark:text-gray-400">
                <!-- 作者 -->
                <div class="mr-4 flex items-center" v-if="article.author">
                  <img 
                    :src="article.author.avatar || 'https://via.placeholder.com/24'" 
                    :alt="article.author.name" 
                    class="w-5 h-5 rounded-full mr-1"
                  />
                  <span>{{ article.author.name }}</span>
                </div>
                
                <!-- 日期 -->
                <div class="mr-4">
                  <span>{{ formatDate(article.createdAt) }}</span>
                </div>
                
                <!-- 分类 -->
                <div class="mr-4" v-if="article.category">
                  <router-link :to="`/category/${article.category.id}`" class="hover:text-blue-600 dark:hover:text-blue-400">
                    {{ article.category.name }}
                  </router-link>
                </div>
                
                <!-- 标签 -->
                <div class="flex flex-wrap gap-1" v-if="article.tags && article.tags.length > 0">
                  <router-link 
                    v-for="tag in article.tags" 
                    :key="tag.id" 
                    :to="`/tag/${tag.id}`"
                    class="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    #{{ tag.name }}
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 分页 -->
        <div class="mt-8" v-if="total > pageSize">
          <pagination 
            :current-page="currentPage" 
            :total="total" 
            :page-size="pageSize" 
            @change="handlePageChange"
          />
        </div>
      </div>
      
      <!-- 无结果 -->
      <div v-else class="py-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">未找到结果</h2>
        <p class="text-gray-500 mb-6">没有找到与"{{ displayQuery }}"相关的内容</p>
        <p class="text-gray-500">尝试其他搜索词或浏览下面的热门标签</p>
        
        <!-- 热门标签 -->
        <div class="mt-8">
          <tag-cloud />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearchStore } from '../stores/search'
import TagCloud from '../components/core/TagCloud.vue'
import Pagination from '../components/core/Pagination.vue'

// 获取路由参数
const route = useRoute()
const router = useRouter()

// 获取store
const searchStore = useSearchStore()

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

watch(() => route.query, syncFromRoute, { immediate: true })

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
      router.push({
        path: '/search',
        query: nextQuery
      })
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

    articles.value = result.items || []
    total.value = result.total || 0
  } catch (error) {
    console.error('搜索失败:', error)
    articles.value = []
    total.value = 0
  } finally {
    loading.value = false
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
    router.push({
      path: '/search'
    })
  }
}

// 页码变更
const handlePageChange = (page) => {
  currentPage.value = page
  const keyword = trimmedQuery.value
  if (!keyword) return

  router.push({
    path: '/search',
    query: {
      keyword,
      page
    }
  })

  // 滚动到顶部
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 高亮关键词
const highlightKeywords = (text) => {
  if (!text) return ''
  
  const keywords = searchQuery.value.trim().split(/\s+/)
  let highlightedText = text
  
  // 提取文本中包含关键词的段落
  const maxLength = 200
  const textLower = text.toLowerCase()
  
  // 找出第一个匹配关键词的位置
  let startPosition = -1
  for (const keyword of keywords) {
    const pos = textLower.indexOf(keyword.toLowerCase())
    if (pos !== -1) {
      startPosition = pos
      break
    }
  }
  
  // 如果找到关键词，截取包含关键词的片段
  if (startPosition !== -1) {
    const start = Math.max(0, startPosition - 50)
    const end = Math.min(text.length, start + maxLength)
    highlightedText = text.substring(start, end)
    
    // 如果不是从头开始，添加省略号
    if (start > 0) {
      highlightedText = '...' + highlightedText
    }
    
    // 如果不是到末尾结束，添加省略号
    if (end < text.length) {
      highlightedText = highlightedText + '...'
    }
  } else {
    // 如果没找到关键词，截取前面一部分
    highlightedText = text.substring(0, maxLength) + (text.length > maxLength ? '...' : '')
  }
  
  // 高亮关键词
  for (const keyword of keywords) {
    if (keyword.trim()) {
      const regex = new RegExp(`(${keyword})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<span class="bg-yellow-200 dark:bg-yellow-700">$1</span>')
    }
  }
  
  return highlightedText
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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




