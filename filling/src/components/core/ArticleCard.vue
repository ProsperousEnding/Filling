<template>
  <div class="article-card">
    <!-- 文章封面图 -->
    <div v-if="article.cover" class="aspect-w-16 aspect-h-9 mb-4">
      <img 
        :src="article.cover" 
        :alt="article.title" 
        class="object-cover w-full h-full rounded-t-lg"
      />
    </div>
    
    <!-- 文章内容 -->
    <div class="p-6">
      <!-- 分类 -->
      <div class="mb-2" v-if="article.category">
        <router-link :to="`/category/${article.category.id}`" class="category-badge">
          {{ article.category.name }}
        </router-link>
      </div>
      
      <!-- 标题 -->
      <h2 class="article-title">
        <router-link :to="`/article/${article.id}`">
          {{ article.title }}
        </router-link>
      </h2>
      
      <!-- 摘要 -->
      <p class="article-excerpt">
        {{ article.excerpt || truncateText(article.content, 120) }}
      </p>
      
      <!-- 文章元信息 -->
      <div class="article-meta">
        <!-- 作者信息 -->
        <div class="flex items-center mr-4" v-if="article.author">
          <img 
            :src="article.author.avatar || 'https://via.placeholder.com/40'" 
            :alt="article.author.name" 
            class="w-6 h-6 rounded-full mr-2"
          />
          <span class="text-gray-700 dark:text-gray-300">{{ article.author.name }}</span>
        </div>
        
        <!-- 发布日期 -->
        <div class="flex items-center mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ formatDate(article.createdAt) }}</span>
        </div>
        
        <!-- 阅读时间 -->
        <div class="flex items-center" v-if="config.showReadTime">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ calculateReadTime(article.content) }} 分钟阅读</span>
        </div>
      </div>
      
      <!-- 标签 -->
      <div class="mt-4 flex flex-wrap" v-if="article.tags && article.tags.length > 0">
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
  </div>
</template>

<script setup>
import { useConfigStore } from '../../stores/config'

// 接收文章数据
const props = defineProps({
  article: {
    type: Object,
    required: true
  }
})

// 获取配置
const configStore = useConfigStore()
const config = configStore

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 截断文本
const truncateText = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
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