<template>
  <div class="archive-view">
    <div v-if="loading" class="py-12 flex justify-center">
      <div class="inline-flex items-center text-gray-500">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        加载归档...
      </div>
    </div>
    
    <div v-else>
      <!-- 归档标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          文章归档
        </h1>
      </div>
      
      <!-- 年份筛选 -->
      <div class="mb-8">
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="year in availableYears" 
            :key="year" 
            @click="filterByYear(year)"
            class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
            :class="selectedYear === year 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
          >
            {{ year }}
          </button>
        </div>
      </div>
      
      <!-- 归档列表 -->
      <div v-if="groupedArticles.length > 0">
        <div 
          v-for="(group, index) in groupedArticles" 
          :key="index"
          class="mb-12"
        >
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            {{ group.month }}
          </h2>
          
          <ul class="space-y-4">
            <li 
              v-for="article in group.articles" 
              :key="article.id"
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <router-link 
                  :to="`/article/${article.id}`"
                  class="text-lg font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {{ article.title }}
                </router-link>
                
                <div class="flex flex-wrap text-sm text-gray-500 dark:text-gray-400 mt-1">
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
              
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(article.createdAt) }}
              </div>
            </li>
          </ul>
        </div>
      </div>
      
      <div v-else class="py-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h2 class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">暂无文章</h2>
        <p class="text-gray-500 mb-6">该时间段内没有文章发布</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useArticleStore } from '../stores/article'

// 获取store
const articleStore = useArticleStore()

// 状态
const articles = ref([])
const loading = ref(false)
const selectedYear = ref(new Date().getFullYear())  // 默认当前年份

// 生命周期
onMounted(async () => {
  await fetchArchiveArticles()
})

// 获取归档文章
const fetchArchiveArticles = async () => {
  loading.value = true
  try {
    const result = await articleStore.fetchArchiveArticles(selectedYear.value)
    articles.value = result || []
  } catch (error) {
    console.error('获取归档文章失败:', error)
    articles.value = []
  } finally {
    loading.value = false
  }
}

// 可用年份列表（当前年份往前推5年）
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i)
  }
  return years
})

// 按年份筛选
const filterByYear = (year) => {
  selectedYear.value = year
  fetchArchiveArticles()
}

// 按月份分组文章
const groupedArticles = computed(() => {
  const groups = {}
  
  // 确保articles.value是数组
  const articlesArray = Array.isArray(articles.value) ? articles.value : []
  
  articlesArray.forEach(article => {
    const date = new Date(article.createdAt)
    const monthKey = date.toLocaleDateString('zh-CN', { month: 'long' })
    
    if (!groups[monthKey]) {
      groups[monthKey] = {
        month: monthKey,
        articles: []
      }
    }
    
    groups[monthKey].articles.push(article)
  })
  
  // 转换为数组并按月份倒序排序
  return Object.values(groups).sort((a, b) => {
    const monthA = new Date(`${a.month} 1, ${selectedYear.value}`).getMonth()
    const monthB = new Date(`${b.month} 1, ${selectedYear.value}`).getMonth()
    return monthB - monthA
  })
})

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}
</script> 