<template>
  <div class="article-list-view">
    <!-- 页面标题 -->
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">所有文章</h1>
    
    <!-- 文章列表 - 使用网格卡片组件 -->
    <article-grid-view 
      :articles="displayedArticles" 
      :total="total" 
      :loading="loading" 
      :current-page="currentPage"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useArticleStore } from '../stores/article'
import { useConfigStore } from '../stores/config'
import ArticleGridView from '../components/core/ArticleGridView.vue'

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
const pageSize = ref(configStore.pageSize || 10)

// 计算当前页显示的文章
const displayedArticles = computed(() => {
  return articles.value;
});

// 页面加载时获取文章
onMounted(async () => {
  await fetchArticles();
});

// 获取文章列表
const fetchArticles = async () => {
  loading.value = true;
  try {
    const response = await articleStore.fetchArticles({
      page: currentPage.value,
      pageSize: pageSize.value
    });
    
    articles.value = response.data;
    total.value = response.total;
  } catch (error) {
    console.error('获取文章列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 处理分页变化
const handlePageChange = (page) => {
  currentPage.value = page;
  // 更新URL参数
  router.push({ 
    query: { ...route.query, page } 
  });
  // 获取该页文章
  fetchArticles();
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script> 