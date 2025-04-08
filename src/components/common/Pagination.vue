<template>
  <div class="pagination">
    <!-- 上一页 -->
    <button
      class="pagination-item"
      :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 }"
      :disabled="currentPage === 1"
      @click="handlePrev"
    >
      上一页
    </button>
    
    <!-- 页码 -->
    <template v-for="page in pageNumbers" :key="page">
      <!-- 省略号 -->
      <span
        v-if="page === '...'"
        class="px-4 py-2 text-gray-500 dark:text-gray-400"
      >
        ...
      </span>
      
      <!-- 页码按钮 -->
      <button
        v-else
        class="pagination-item"
        :class="{ 'pagination-item-active': page === currentPage }"
        @click="handlePageClick(page)"
      >
        {{ page }}
      </button>
    </template>
    
    <!-- 下一页 -->
    <button
      class="pagination-item"
      :class="{ 'opacity-50 cursor-not-allowed': currentPage === totalPages }"
      :disabled="currentPage === totalPages"
      @click="handleNext"
    >
      下一页
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// 定义属性
const props = defineProps({
  // 当前页码
  currentPage: {
    type: Number,
    default: 1
  },
  // 数据总数
  total: {
    type: Number,
    required: true
  },
  // 每页数量
  pageSize: {
    type: Number,
    default: 10
  },
  // 显示的页码数量
  showPageCount: {
    type: Number,
    default: 5
  }
})

// 定义事件
const emit = defineEmits(['change'])

// 总页数
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

// 生成页码数组
const pageNumbers = computed(() => {
  const current = props.currentPage
  const total = totalPages.value
  const count = props.showPageCount
  
  // 总页数小于等于显示页码数时，显示全部页码
  if (total <= count) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  
  // 显示的页码
  const pages = []
  
  // 当前页码接近开始位置
  if (current <= Math.ceil(count / 2)) {
    for (let i = 1; i <= count - 1; i++) {
      pages.push(i)
    }
    pages.push('...')
    pages.push(total)
  }
  // 当前页码接近结束位置
  else if (current >= total - Math.floor(count / 2)) {
    pages.push(1)
    pages.push('...')
    for (let i = total - count + 2; i <= total; i++) {
      pages.push(i)
    }
  }
  // 当前页码在中间位置
  else {
    pages.push(1)
    pages.push('...')
    const half = Math.floor((count - 4) / 2)
    for (let i = current - half; i <= current + half; i++) {
      pages.push(i)
    }
    pages.push('...')
    pages.push(total)
  }
  
  return pages
})

// 页码点击处理
const handlePageClick = (page) => {
  if (page !== props.currentPage && page !== '...') {
    emit('change', page)
  }
}

// 上一页
const handlePrev = () => {
  if (props.currentPage > 1) {
    emit('change', props.currentPage - 1)
  }
}

// 下一页
const handleNext = () => {
  if (props.currentPage < totalPages.value) {
    emit('change', props.currentPage + 1)
  }
}
</script> 