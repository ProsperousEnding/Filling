<template>
  <div class="article-list-view">
    <!-- 加载中状态 -->
    <div v-if="loading" class="flex justify-center my-8 md:my-12">
      <div class="theme-loading-pill inline-flex items-center px-4 py-2 md:px-6 md:py-3 rounded-full">
        <svg class="animate-spin -ml-1 mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        正在加载...
      </div>
    </div>
    
    <!-- 文章列表 -->
    <div v-else>
      <!-- 文章为空 -->
      <div v-if="!articles || articles.length === 0" class="theme-empty-state flex flex-col items-center justify-center py-8 md:py-12">
        <div class="theme-empty-card rounded-xl p-6 md:p-8">
          <svg xmlns="http://www.w3.org/2000/svg" class="theme-empty-icon h-12 w-12 md:h-16 md:w-16 mb-3 md:mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p class="theme-empty-text text-center text-base md:text-lg">暂无文章</p>
        </div>
      </div>
      
      <!-- 全背景图列表布局 - 单列 -->
      <div v-else class="article-feed-list space-y-5 md:space-y-8">
        <ArticleFeedItem
          v-for="article in articles"
          :key="article.id"
          :article="article"
          :is-small-screen="isSmallScreen"
        />
        
        <!-- 分页 -->
        <div v-if="totalPages > 1" class="article-feed-pagination mt-8 md:mt-10 flex justify-center">
          <pagination 
            :current-page="currentPage" 
            :total-pages="totalPages"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ArticleFeedItem from './ArticleFeedItem.vue'
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
    default: 8
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

// 窗口宽度
const windowWidth = ref(1024) // 默认值
const isSmallScreen = computed(() => windowWidth.value < 640)
const syncWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

// 监听窗口大小变化
onMounted(() => {
  syncWindowWidth()
  window.addEventListener('resize', syncWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', syncWindowWidth)
})
</script>

<style scoped>
.article-item {
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.article-item:hover {
  transform: translateY(-3px);
}

@media (max-width: 640px) {
  .article-item:hover {
    transform: translateY(-2px);
  }
}
</style> 
