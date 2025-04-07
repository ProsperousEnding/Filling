<template>
  <div class="article-detail-view">
    <!-- 加载中 -->
    <div v-if="loading" class="py-12 flex justify-center">
      <div class="inline-flex items-center text-gray-500">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        正在加载文章...
      </div>
    </div>
    
    <!-- 文章找不到 -->
    <div v-else-if="!article" class="py-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">文章未找到</h2>
      <p class="text-gray-500 mb-6">该文章可能已被删除或您访问的链接有误</p>
      <router-link to="/" class="btn-primary">返回首页</router-link>
    </div>
    
    <!-- 文章内容 -->
    <article v-else>
      <!-- 文章头部 -->
      <header class="mb-8">
        <!-- 分类 -->
        <div class="mb-4" v-if="article.category">
          <router-link :to="`/category/${article.category.id}`" class="category-badge">
            {{ article.category.name }}
          </router-link>
        </div>
        
        <!-- 标题 -->
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {{ article.title }}
        </h1>
        
        <!-- 文章元信息 -->
        <div class="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400">
          <!-- 作者信息 -->
          <div class="flex items-center mr-6" v-if="article.author">
            <img 
              :src="article.author.avatar || 'https://via.placeholder.com/40'" 
              :alt="article.author.name" 
              class="w-8 h-8 rounded-full mr-2"
            />
            <span>{{ article.author.name }}</span>
          </div>
          
          <!-- 发布日期 -->
          <div class="flex items-center mr-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{{ formatDate(article.createdAt) }}</span>
          </div>
          
          <!-- 阅读时间 -->
          <div class="flex items-center mr-6" v-if="config.showReadTime">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ calculateReadTime(article.content) }} 分钟阅读</span>
          </div>
          
          <!-- 浏览量 -->
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{{ article.views }} 次浏览</span>
          </div>
        </div>
      </header>
      
      <!-- 封面图 -->
      <div v-if="article.cover" class="mb-8">
        <img 
          :src="article.cover" 
          :alt="article.title" 
          class="w-full h-auto rounded-lg shadow-md"
        />
      </div>
      
      <!-- 文章内容 -->
      <div class="article-content prose prose-lg dark:prose-invert max-w-none mb-8" v-html="article.content"></div>
      
      <!-- 文章标签 -->
      <div class="mb-8" v-if="article.tags && article.tags.length > 0">
        <div class="flex flex-wrap">
          <router-link 
            v-for="tag in article.tags" 
            :key="tag.id" 
            :to="`/tag/${tag.id}`" 
            class="tag"
          >
            {{ tag.name }}
          </router-link>
        </div>
      </div>
      
      <!-- 相关文章 -->
      <div class="mb-12" v-if="relatedArticles.length > 0">
        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">相关文章</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            v-for="related in relatedArticles" 
            :key="related.id" 
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <router-link :to="`/article/${related.id}`">
              <img 
                v-if="related.cover" 
                :src="related.cover" 
                :alt="related.title" 
                class="w-full h-40 object-cover"
              />
              <div class="p-4">
                <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  {{ related.title }}
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(related.createdAt) }}
                </p>
              </div>
            </router-link>
          </div>
        </div>
      </div>
      
      <!-- 评论区 -->
      <comment-system :article-id="articleId" />
    </article>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useArticleStore } from '../stores/article'
import { useConfigStore } from '../stores/config'
import CommentSystem from '../components/core/CommentSystem.vue'

// 获取路由参数
const route = useRoute()
const articleId = computed(() => route.params.id)

// 获取store
const articleStore = useArticleStore()
const configStore = useConfigStore()
const config = configStore

// 状态
const article = ref(null)
const relatedArticles = ref([])
const loading = ref(false)

// 加载文章详情
onMounted(async () => {
  await fetchArticleDetail()
})

// 获取文章详情
const fetchArticleDetail = async () => {
  if (!articleId.value) return
  
  loading.value = true
  try {
    // 获取文章详情
    const articleData = await articleStore.fetchArticleDetail(articleId.value)
    article.value = articleData
    
    // 获取相关文章
    if (article.value) {
      try {
        const relatedData = await articleStore.fetchRelatedArticles(articleId.value, 3)
        relatedArticles.value = relatedData || []
      } catch (error) {
        console.error('获取相关文章失败:', error)
      }
    }
  } catch (error) {
    console.error('获取文章详情失败:', error)
  } finally {
    loading.value = false
  }
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

// 计算阅读时间
const calculateReadTime = (content) => {
  if (!content) return 1
  // 平均阅读速度：中文每分钟300字
  const wordsPerMinute = 300
  const textLength = content.length
  return Math.max(1, Math.ceil(textLength / wordsPerMinute))
}
</script>

<style>
.article-content {
  /* 可以在这里添加文章内容样式 */
}
</style> 