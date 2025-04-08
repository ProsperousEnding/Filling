<template>
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
</template>

<script setup>
import { computed } from 'vue'

// 组件属性
const props = defineProps({
  currentPage: {
    type: Number,
    default: 1
  },
  total: {
    type: Number,
    required: true
  },
  pageSize: {
    type: Number,
    default: 10
  },
  maxDisplayed: {
    type: Number,
    default: 5
  }
})

// 组件事件
const emit = defineEmits(['change'])

// 总页数
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.total / props.pageSize))
})

// 显示的页码
const displayedPages = computed(() => {
  const totalDisplayed = props.maxDisplayed
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

// 页码变化处理
const onPageChange = (page) => {
  if (page < 1 || page > totalPages.value || page === props.currentPage) {
    return
  }
  emit('change', page)
}
</script>