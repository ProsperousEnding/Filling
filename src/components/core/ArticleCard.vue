<template>
  <div class="article-card flex flex-col bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 h-full overflow-hidden border border-gray-100 dark:border-gray-700 hover:scale-[1.02]">
    <!-- 文章封面 -->
    <div v-if="article.imageUrl || article.cover" class="article-cover h-48 overflow-hidden">
      <router-link :to="`/article/${article.id}`">
        <img 
          :src="article.imageUrl || article.cover" 
          :alt="article.title" 
          class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      </router-link>
    </div>
    
    <!-- 文章内容 -->
    <div class="p-6 flex flex-col flex-grow">
      <!-- 分类和日期 -->
      <div class="flex justify-between items-center mb-3">
        <span 
          v-if="article.category" 
          class="inline-block px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
        >
          {{ typeof article.category === 'string' ? article.category : article.category.name }}
        </span>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {{ formatDate(article.publishDate || article.createdAt) }}
        </span>
      </div>
      
      <!-- 标题 -->
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
        <router-link :to="`/article/${article.id}`" class="block">
          {{ article.title }}
        </router-link>
      </h3>
      
      <!-- 摘要 -->
      <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-grow leading-relaxed">
        {{ article.excerpt || article.summary || truncateText(article.content, 120) }}
      </p>
      
      <!-- 底部信息 -->
      <div class="mt-auto">
        <!-- 标签 -->
        <div v-if="article.tags && article.tags.length" class="flex flex-wrap gap-2 mb-4">
          <span 
            v-for="tag in article.tags" 
            :key="typeof tag === 'string' ? tag : tag.id"
            class="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            #{{ typeof tag === 'string' ? tag : tag.name }}
          </span>
        </div>
        
        <!-- 作者信息或阅读数 -->
        <div class="flex justify-between items-center mb-4">
          <div v-if="article.author" class="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <div class="h-6 w-6 rounded-full overflow-hidden mr-2 ring-1 ring-gray-200 dark:ring-gray-700">
              <img 
                v-if="typeof article.author !== 'string' && article.author.avatar" 
                :src="article.author.avatar" 
                :alt="typeof article.author === 'string' ? article.author : article.author.name"
                class="w-full h-full object-cover"
              />
              <span v-else class="flex items-center justify-center w-full h-full bg-blue-500 text-white font-medium text-xs">
                {{ (typeof article.author === 'string' ? article.author : article.author.name).charAt(0) }}
              </span>
            </div>
            <span>{{ typeof article.author === 'string' ? article.author : article.author.name }}</span>
          </div>
          <div v-if="article.readCount !== undefined || article.readTime" class="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{{ article.readCount !== undefined ? `${article.readCount} 阅读` : article.readTime }}</span>
          </div>
        </div>
        
        <!-- 阅读更多 -->
        <router-link 
          :to="`/article/${article.id}`" 
          class="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 rounded-lg px-3 py-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
        >
          阅读更多
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  article: {
    type: Object,
    required: true
  }
})

// 日期格式化
const formatDate = (dateString) => {
  if (!dateString) return '未知日期'
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 文本截断
const truncateText = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}
</script> 