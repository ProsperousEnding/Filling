<template>
  <div class="article-list-view">
    <!-- 加载中状态 -->
    <div v-if="loading" class="flex justify-center my-8 md:my-12">
      <div class="inline-flex items-center px-4 py-2 md:px-6 md:py-3 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-500 shadow-sm">
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
      <div v-if="!articles || articles.length === 0" class="flex flex-col items-center justify-center py-8 md:py-12">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 md:h-16 md:w-16 text-gray-300 mb-3 md:mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p class="text-gray-500 text-center text-base md:text-lg">暂无文章</p>
        </div>
      </div>
      
      <!-- 全背景图列表布局 - 单列 -->
      <div v-else class="space-y-5 md:space-y-8">
        <div v-for="article in articles" :key="article.id" class="article-item">
          <!-- 文章项 - 全背景设计 -->
          <div 
            class="relative h-52 sm:h-56 md:h-64 rounded-lg md:rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-cover bg-center border border-gray-100 dark:border-gray-700"
            :style="(article.imageUrl || article.cover) ? { 
              backgroundImage: `url('${article.imageUrl || article.cover}')` 
            } : { backgroundColor: 'rgba(243, 244, 246, 1)', backgroundImage: 'none' }"
          >
            <!-- 渐变遮罩 - 全覆盖式渐变 -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20"></div>
            
            <!-- 无背景图时的替代背景 -->
            <div v-if="!(article.imageUrl || article.cover)" class="absolute inset-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 md:h-16 md:w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            
            <!-- 文章内容层 -->
            <div class="absolute inset-0 flex flex-col justify-between p-4 sm:p-5 md:p-6 z-10">
              <!-- 顶部区域 -->
              <div class="flex justify-between items-start">
                <!-- 分类标签 -->
                <div v-if="article.category">
                  <router-link :to="`/category/${article.category.id}`" 
                    class="inline-block px-2 py-0.5 md:px-3 md:py-1 text-xs font-medium bg-white/90 dark:bg-gray-800/90 text-blue-600 dark:text-blue-400 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 shadow-sm">
                    {{ typeof article.category === 'string' ? article.category : article.category.name }}
                  </router-link>
                </div>
                
                <!-- 标签 - 在移动设备上只显示一个标签 -->
                <div class="flex flex-wrap justify-end" v-if="article.tags && article.tags.length > 0">
                  <router-link 
                    v-for="tag in article.tags.slice(0, isSmallScreen ? 1 : 3)" 
                    :key="typeof tag === 'string' ? tag : tag.id" 
                    :to="`/tag/${typeof tag === 'string' ? tag : tag.id}`" 
                    class="ml-1 md:ml-2 mb-1 px-2 py-0.5 text-xs bg-black/40 text-gray-100 rounded-full hover:bg-black/60 transition-colors duration-200"
                  >
                    #{{ typeof tag === 'string' ? tag : tag.name }}
                  </router-link>
                  <span v-if="article.tags.length > (isSmallScreen ? 1 : 3)" class="text-xs text-gray-300 ml-1 md:ml-2">+{{ article.tags.length - (isSmallScreen ? 1 : 3) }}</span>
                </div>
              </div>
              
              <!-- 中间区域 - 标题 -->
              <div class="mt-4 md:mt-6 mb-auto">
                <h2 class="text-lg md:text-xl font-semibold text-white hover:text-blue-200 transition-colors duration-200 drop-shadow-sm">
                  <router-link :to="`/article/${article.id}`">
                    {{ article.title }}
                  </router-link>
                </h2>
                
                <!-- 摘要 - 在移动设备上减少显示行数 -->
                <p class="text-xs md:text-sm text-gray-200 line-clamp-1 sm:line-clamp-2 leading-relaxed mt-1 md:mt-2 mb-2 md:mb-3 drop-shadow-sm max-w-3xl">
                  {{ article.excerpt || article.summary || truncateText(article.content, isSmallScreen ? 60 : 100) }}
                </p>
              </div>
              
              <!-- 底部区域 - 作者信息 -->
              <div class="flex items-center justify-between">
                <!-- 作者信息 -->
                <div class="flex items-center" v-if="article.author">
                  <div class="h-6 w-6 md:h-7 md:w-7 rounded-full overflow-hidden mr-2 ring-1 ring-white/30">
                    <img 
                      :src="typeof article.author === 'string' ? 'https://via.placeholder.com/40' : (article.author.avatar || 'https://via.placeholder.com/40')" 
                      :alt="typeof article.author === 'string' ? article.author : article.author.name" 
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs md:text-sm text-white font-medium">
                      {{ typeof article.author === 'string' ? article.author : article.author.name }}
                    </span>
                    <!-- 在移动设备上简化显示 -->
                    <div class="hidden sm:flex items-center text-xs text-gray-300">
                      <!-- 发布日期 -->
                      <time class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {{ formatDate(article.publishDate || article.createdAt) }}
                      </time>
                      
                      <!-- 分隔点 -->
                      <span class="mx-2">·</span>
                      
                      <!-- 阅读时间/数量 -->
                      <span v-if="article.readCount !== undefined || article.readTime" class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {{ article.readCount !== undefined ? `${article.readCount} 阅读` : article.readTime }}
                      </span>
                    </div>
                    <!-- 移动设备上只显示日期 -->
                    <div class="flex sm:hidden items-center text-xs text-gray-300">
                      <time>{{ formatShortDate(article.publishDate || article.createdAt) }}</time>
                    </div>
                  </div>
                </div>
                
                <!-- 阅读按钮 -->
                <router-link :to="`/article/${article.id}`" class="px-3 py-1 md:px-4 md:py-1.5 text-xs font-medium text-white bg-black/30 hover:bg-blue-600/80 rounded-full transition-colors duration-300 flex items-center">
                  阅读
                  <span class="hidden sm:inline">全文</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 md:h-3.5 md:w-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </router-link>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 分页 -->
        <div v-if="totalPages > 1" class="mt-8 md:mt-10 flex justify-center">
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
import { computed, onMounted, ref } from 'vue'
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

// 日期格式化
const formatDate = (dateString) => {
  if (!dateString) return '未知日期'
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 短日期格式（移动端使用）
const formatShortDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 文本截断
const truncateText = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// 窗口宽度
const windowWidth = ref(1024) // 默认值
const isSmallScreen = computed(() => windowWidth.value < 640)

// 监听窗口大小变化
onMounted(() => {
  // 只在客户端执行
  windowWidth.value = window.innerWidth
  window.addEventListener('resize', () => {
    windowWidth.value = window.innerWidth
  })
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