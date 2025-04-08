<template>
  <div class="home-view">
    <!-- 页面标题 -->
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">最新文章</h1>
    
    <!-- 文章列表 -->
    <article-list 
      :articles="articles" 
      :total="total" 
      :loading="loading" 
      :current-page="currentPage"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useArticleStore } from '../stores/article'
import { useConfigStore } from '../stores/config'
import ArticleList from '../components/core/ArticleList.vue'

// 获取store
const articleStore = useArticleStore()
const configStore = useConfigStore()

// 路由
const router = useRouter()
const route = useRoute()

// 状态
const articles = ref([])
const total = ref(0)
const loading = ref(false)
const currentPage = ref(parseInt(route.query.page) || 1)
const pageSize = ref(configStore.pageSize)

// 页面加载时获取文章
onMounted(async () => {
  await fetchArticles()
})

// 获取文章列表
const fetchArticles = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    const response = await articleStore.fetchArticles(params)
    articles.value = response.data || []
    total.value = response.total || 0
  } catch (error) {
    console.error('获取文章列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  // 更新URL参数
  router.push({ 
    query: { ...route.query, page } 
  })
  // 获取该页文章
  fetchArticles()
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script> 