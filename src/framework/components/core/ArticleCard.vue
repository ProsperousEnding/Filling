<template>
  <div class="article-card article-card-shell flex flex-col backdrop-blur-sm rounded-2xl transition-all duration-300 h-full overflow-hidden">
    <!-- 文章封面 -->
    <div v-if="article.imageUrl || article.cover" class="article-card-cover h-48 overflow-hidden">
      <router-link :to="articleRoute">
        <img 
          :src="article.imageUrl || article.cover" 
          :alt="article.title" 
          class="article-card-cover-image w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      </router-link>
    </div>
    
    <!-- 文章内容 -->
    <div class="article-card-body p-6 flex flex-col flex-grow">
      <!-- 分类和日期 -->
      <div class="article-card-meta flex justify-between items-center mb-3 gap-3">
        <span 
          v-if="article.category" 
          class="article-card-category inline-block px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200"
        >
          {{ typeof article.category === 'string' ? article.category : article.category.name }}
        </span>
        <span class="article-card-date text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {{ formatDate(article.publishDate || article.createdAt) }}
        </span>
      </div>
      
      <div ref="textBlockRef" class="article-card-copy">
        <!-- 标题 -->
        <h3 class="article-card-title text-lg leading-[1.35] font-medium mb-3 transition-colors duration-200">
          <router-link :to="articleRoute" class="article-card-title-link block">
            <MeasuredText
              tag="span"
              class="block"
              :text="article.title"
              :lines="2"
              :available-width="textBlockWidth"
            />
          </router-link>
        </h3>
        
        <!-- 摘要 -->
        <MeasuredText
          tag="p"
          class="article-card-excerpt text-sm mb-4 flex-grow leading-relaxed"
          :text="article.excerpt"
          :lines="3"
          :available-width="textBlockWidth"
        />
      </div>
      
      <!-- 底部信息 -->
      <div class="mt-auto">
        <!-- 标签 -->
        <div v-if="article.tags && article.tags.length" class="article-card-tags flex flex-wrap gap-2 mb-4">
          <span 
            v-for="tag in article.tags" 
            :key="typeof tag === 'string' ? tag : tag.id"
            class="article-card-tag inline-block px-2 py-0.5 text-xs rounded-full transition-colors duration-200"
          >
            #{{ typeof tag === 'string' ? tag : tag.name }}
          </span>
        </div>
        
        <!-- 阅读更多 -->
        <router-link 
          :to="articleRoute" 
          class="article-card-read-link inline-flex items-center text-sm font-medium transition-colors duration-200 rounded-lg px-3 py-1"
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
import { computed } from 'vue'
import { useElementWidth } from '../../composables/useElementWidth'
import MeasuredText from './MeasuredText.vue'
import { getArticleRoute } from '../../utils/articleRoute'

const props = defineProps({
  article: {
    type: Object,
    required: true
  }
})

const articleRoute = computed(() => getArticleRoute(props.article))
const { elementRef: textBlockRef, width: textBlockWidth } = useElementWidth()

// 日期格式化
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

</script>
