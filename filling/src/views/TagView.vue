<template>
  <div class="tag-view">
    <div v-if="loading" class="py-12 flex justify-center">
      <div class="inline-flex items-center text-gray-500">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        加载中...
      </div>
    </div>
    
    <div v-else>
      <!-- 标签标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          <span class="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-sm font-medium">
            # {{ tag ? tag.name : '标签' }}
          </span>
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-4" v-if="tag && tag.description">
          {{ tag.description }}
        </p>
      </div>
      
      <!-- 文章列表 -->
      <article-list 
        :articles="articles" 
        :total="total" 
        :loading="loading" 
        :current-page="currentPage"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleStore } from '../stores/article'
import { useTagStore } from '../stores/tag'

// 获取路由参数
const route = useRoute()
const router = useRouter()
const tagId = ref(route.params.id)

// 获取store
const articleStore = useArticleStore()
const tagStore = useTagStore()

// 状态
const tag = ref(null)
const articles = ref([])
const total = ref(0)
const loading = ref(false)
const currentPage = ref(parseInt(route.query.page) || 1)
const pageSize = ref(10)

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  if (newId !== tagId.value) {
    tagId.value = newId
    fetchTag()
    fetchArticles()
  }
})

// 生命周期
onMounted(async () => {
  await fetchTag()
  await fetchArticles()
})

// 获取标签信息
const fetchTag = async () => {
  if (!tagId.value) return
  
  try {
    const tagData = await tagStore.fetchTagById(tagId.value)
    tag.value = tagData
  } catch (error) {
    console.error('获取标签信息失败:', error)
  }
}

// 获取文章列表
const fetchArticles = async () => {
  if (!tagId.value) return
  
  loading.value = true
  try {
    const offset = (currentPage.value - 1) * pageSize.value
    const result = await articleStore.fetchArticlesByTag(
      tagId.value, 
      pageSize.value, 
      offset
    )
    
    articles.value = result.items || []
    total.value = result.total || 0
  } catch (error) {
    console.error('获取标签文章失败:', error)
    articles.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 页码变更
const handlePageChange = (page) => {
  currentPage.value = page
  
  // 更新URL参数
  router.push({
    path: route.path,
    query: { ...route.query, page }
  })
  
  // 获取新页面的文章
  fetchArticles()
  
  // 滚动到顶部
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
</script> 