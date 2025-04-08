<template>
  <div class="article-list">
    <!-- 加载中状态 -->
    <div v-if="loading" class="flex justify-center my-12">
      <div class="inline-flex items-center px-4 py-2 text-gray-500">
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
      <div v-if="!articles || articles.length === 0" class="flex flex-col items-center justify-center py-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p class="text-gray-500">暂无文章</p>
      </div>
      
      <!-- 文章列表内容 -->
      <div v-else class="space-y-8">
        <article-card 
          v-for="article in articles" 
          :key="article.id" 
          :article="article"
        />
      </div>
      
      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <!-- 上一页 -->
        <button 
          @click="onPageChange(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="pagination-item" 
          :class="{'opacity-50 cursor-not-allowed': currentPage === 1}"
        >
          上一页
        </button>
        
        <!-- 页码 -->
        <template v-for="page in displayedPages" :key="page">
          <span 
            v-if="page === '...'" 
            class="px-4 py-2"
          >
            ...
          </span>
          <button 
            v-else 
            @click="onPageChange(page)" 
            :class="page === currentPage ? 'pagination-item-active' : 'pagination-item'"
          >
            {{ page }}
          </button>
        </template>
        
        <!-- 下一页 -->
        <button 
          @click="onPageChange(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="pagination-item" 
          :class="{'opacity-50 cursor-not-allowed': currentPage === totalPages}"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import ArticleCard from './ArticleCard.vue'
import { useConfigStore } from '../../stores/config'

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
    default: 0
  }
})

// 组件事件
const emit = defineEmits(['page-change'])

// 获取配置
const configStore = useConfigStore()
const pageSize = ref(props.pageSize || configStore.pageSize)

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(props.total / pageSize.value)
})

// 计算显示的页码
const displayedPages = computed(() => {
  const totalDisplayed = 5 // 最多显示5个页码
  const pages = []
  
  if (totalPages.value <= totalDisplayed) {
    // 总页数少于显示数量，全部显示
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    // 总页数大于显示数量，需要省略部分页码
    const leftSide = Math.floor(totalDisplayed / 2)
    const rightSide = totalDisplayed - leftSide - 1
    
    if (props.currentPage > leftSide + 1) {
      pages.push(1)
      pages.push('...')
    }
    
    // 计算开始页码和结束页码
    let start = Math.max(1, props.currentPage - leftSide)
    let end = Math.min(totalPages.value, props.currentPage + rightSide)
    
    // 确保显示的数量一致
    if (end - start + 1 < totalDisplayed - 2) {
      if (start === 1) {
        end = Math.min(totalDisplayed - 1, totalPages.value)
      } else {
        start = Math.max(1, end - totalDisplayed + 3)
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (end < totalPages.value - 1) {
      pages.push('...')
    }
    
    if (end < totalPages.value) {
      pages.push(totalPages.value)
    }
  }
  
  return pages
})

// 处理页码变化
const onPageChange = (page) => {
  if (page < 1 || page > totalPages.value || page === props.currentPage) {
    return
  }
  emit('page-change', page)
}
</script> 