<template>
  <div class="search-view">
    <!-- 搜索标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        搜索结果
      </h1>
      
      <!-- 搜索框 -->
      <div class="mb-6">
        <div class="flex items-center">
          <div class="relative flex-grow">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索文章..." 
              class="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keyup.enter="performSearch"
            />
            <button 
              @click="clearSearch" 
              v-if="searchQuery"
              class="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button 
            @click="performSearch"
            class="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
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
import { ref, onMounted, computed } from 'vue'
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
const searchQuery = ref(route.query.q || '')
const displayQuery = ref('')
const articles = ref([])
const total = ref(0)
const loading = ref(false)
const searchPerformed = ref(false)
const currentPage = ref(parseInt(route.query.page) || 1)
const pageSize = ref(10)

// 生命周期
onMounted(() => {
  // 如果URL中有查询参数，执行搜索
  if (searchQuery.value) {
    performSearch()
  }
})

// 执行搜索
const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  loading.value = true
  searchPerformed.value = true
  displayQuery.value = searchQuery.value
  
  try {
    // 更新URL
    router.push({
      path: '/search',
      query: { 
        q: searchQuery.value,
        page: currentPage.value 
      }
    })
    
    // 执行搜索
    const offset = (currentPage.value - 1) * pageSize.value
    const results = await searchStore.search(searchQuery.value, pageSize.value, offset)
    
    articles.value = results.items || []
    total.value = results.total || 0
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
}

// 页码变更
const handlePageChange = (page) => {
  currentPage.value = page
  
  // 更新URL参数
  router.push({
    path: '/search',
    query: { 
      q: searchQuery.value,
      page 
    }
  })
  
  // 获取新页面的搜索结果
  performSearch()
  
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