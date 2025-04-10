<template>
  <div v-if="totalPages > 1" class="flex justify-center mt-10">
    <div class="inline-flex items-center space-x-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
      <!-- 上一页 -->
      <button 
        @click="onPageChange(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200"
        :class="currentPage === 1 
          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <!-- 页码 -->
      <template v-for="page in displayedPages" :key="page">
        <span 
          v-if="page === '...'" 
          class="px-2 text-gray-500 dark:text-gray-400"
        >
          ···
        </span>
        <button 
          v-else 
          @click="onPageChange(page)" 
          class="flex items-center justify-center h-8 w-8 rounded-full text-sm transition-all duration-200"
          :class="page === currentPage 
            ? 'bg-blue-500 text-white font-medium shadow-sm' 
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
        >
          {{ page }}
        </button>
      </template>
      
      <!-- 下一页 -->
      <button 
        @click="onPageChange(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200"
        :class="currentPage === totalPages 
          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 组件属性
const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  }
})

// 组件事件
const emit = defineEmits(['page-change'])

// 计算显示的页码
const displayedPages = computed(() => {
  const totalDisplayed = 5 // 最多显示5个页码
  const pages = []
  
  if (props.totalPages <= totalDisplayed) {
    // 总页数少于显示数量，全部显示
    for (let i = 1; i <= props.totalPages; i++) {
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
    let end = Math.min(props.totalPages, props.currentPage + rightSide)
    
    // 确保显示的数量一致
    if (end - start + 1 < totalDisplayed - 2) {
      if (start === 1) {
        end = Math.min(totalDisplayed - 1, props.totalPages)
      } else {
        start = Math.max(1, end - totalDisplayed + 3)
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (end < props.totalPages - 1) {
      pages.push('...')
    }
    
    if (end < props.totalPages) {
      pages.push(props.totalPages)
    }
  }
  
  return pages
})

// 处理页码变化
const onPageChange = (page) => {
  if (page < 1 || page > props.totalPages || page === props.currentPage) {
    return
  }
  emit('page-change', page)
}
</script>