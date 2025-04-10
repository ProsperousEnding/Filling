<template>
  <div class="article-grid-view">
    <!-- 加载中状态 -->
    <div v-if="loading" class="flex justify-center my-12">
      <div class="inline-flex items-center px-6 py-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-500 shadow-sm">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        正在加载...
      </div>
    </div>
    
    <!-- 文章列表 -->
    <div v-else>
      <!-- 文章为空 -->
      <div v-if="!articles || articles.length === 0" class="flex flex-col items-center justify-center py-12">
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p class="text-gray-500 text-center text-lg">暂无文章</p>
        </div>
      </div>
      
      <!-- 卡片网格 -->
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          <article-card 
            v-for="article in articles" 
            :key="article.id" 
            :article="article"
            class="h-full"
          />
        </div>
        
        <!-- 分页 -->
        <pagination 
          v-if="totalPages > 1"
          :current-page="currentPage" 
          :total-pages="totalPages"
          @page-change="handlePageChange"
          class="mt-12 mb-6"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ArticleCard from './ArticleCard.vue'
import Pagination from './Pagination.vue'

// 组件属性
const props = defineProps({
  articles: {
    type: Array,
    default: () => []
  },
  total: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  }
})

// 组件事件
const emit = defineEmits(['page-change'])

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(props.total / props.pageSize)
})

// 处理分页变化
const handlePageChange = (page) => {
  emit('page-change', page)
}
</script> 