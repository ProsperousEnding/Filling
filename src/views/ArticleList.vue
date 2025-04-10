<template>
  <div class="article-list-view">
    <!-- 页面标题 -->
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">所有文章</h1>
    
    <!-- 文章列表 - 使用网格卡片组件 -->
    <article-grid-view 
      :articles="displayedArticles" 
      :total="mockArticles.length" 
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

// 模拟文章数据
const mockArticles = ref([
  {
    id: 1,
    title: '深入浅出Vue3组合式API',
    summary: 'Vue3的组合式API是一种新的组件逻辑组织方式，本文将深入探讨其使用方法和优势。',
    author: '张三',
    publishDate: '2023-06-15',
    imageUrl: 'https://picsum.photos/id/10/800/450',
    tags: ['Vue', 'JavaScript', '前端'],
    category: { id: 1, name: '前端开发' }
  },
  {
    id: 2,
    title: 'TypeScript高级类型体操详解',
    summary: '探索TypeScript中的高级类型和类型体操，让你的代码更加健壮和可维护。',
    author: '李四',
    publishDate: '2023-06-10',
    imageUrl: 'https://picsum.photos/id/20/800/450',
    tags: ['TypeScript', '前端', '编程语言']
  },
  {
    id: 3,
    title: 'CSS Grid布局完全指南',
    summary: 'CSS Grid是一种强大的二维布局系统，本文将带你掌握其所有核心特性。',
    author: '王五',
    publishDate: '2023-06-05',
    imageUrl: 'https://picsum.photos/id/30/800/450',
    tags: ['CSS', '前端', '布局']
  },
  {
    id: 4,
    title: 'React性能优化最佳实践',
    summary: '如何优化React应用性能？本文分享多年经验总结的最佳实践和常见陷阱。',
    author: '赵六',
    publishDate: '2023-05-28',
    imageUrl: 'https://picsum.photos/id/40/800/450',
    tags: ['React', 'JavaScript', '性能优化']
  },
  {
    id: 5,
    title: 'Node.js微服务架构设计',
    summary: '探讨如何使用Node.js构建可扩展的微服务架构，包括服务发现、负载均衡等关键概念。',
    author: '钱七',
    publishDate: '2023-05-20',
    imageUrl: 'https://picsum.photos/id/50/800/450',
    tags: ['Node.js', '微服务', '后端']
  },
  {
    id: 6,
    title: 'Web3.0与区块链应用开发入门',
    summary: '区块链技术正在改变互联网的未来，本文将介绍Web3.0的核心概念和开发方法。',
    author: '孙八',
    publishDate: '2023-05-15',
    imageUrl: 'https://picsum.photos/id/60/800/450',
    tags: ['区块链', 'Web3.0', '新技术']
  },
  {
    id: 7,
    title: '移动端自适应布局与响应式设计',
    summary: '如何确保你的网站在各种设备上都能完美展示？本文分享响应式设计的核心技巧。',
    author: '周九',
    publishDate: '2023-05-10',
    imageUrl: 'https://picsum.photos/id/70/800/450',
    tags: ['响应式设计', 'CSS', '移动端']
  },
  {
    id: 8,
    title: 'JavaScript异步编程全解析',
    summary: '从回调到Promise再到async/await，全面解析JavaScript异步编程的演进和实践。',
    author: '吴十',
    publishDate: '2023-05-05',
    imageUrl: 'https://picsum.photos/id/80/800/450',
    tags: ['JavaScript', '异步编程', '前端']
  },
  {
    id: 9,
    title: 'GraphQL与RESTful API的比较与实践',
    summary: 'GraphQL正在改变API设计的方式，本文将它与传统RESTful API进行深入对比。',
    author: '郑十一',
    publishDate: '2023-04-28',
    imageUrl: 'https://picsum.photos/id/90/800/450',
    tags: ['GraphQL', 'API设计', '后端']
  },
  {
    id: 10,
    title: 'WebAssembly：Web开发的新前沿',
    summary: 'WebAssembly正在为Web应用带来接近原生的性能，探索这一技术的原理和应用场景。',
    author: '王十二',
    publishDate: '2023-04-20',
    imageUrl: 'https://picsum.photos/id/100/800/450',
    tags: ['WebAssembly', '性能优化', '前端']
  },
  {
    id: 11,
    title: 'TailwindCSS实战指南',
    summary: '如何使用TailwindCSS构建现代、响应式的用户界面，以及它与传统CSS框架的区别。',
    author: '李十三',
    publishDate: '2023-04-15',
    imageUrl: 'https://picsum.photos/id/110/800/450',
    tags: ['CSS', 'TailwindCSS', '前端']
  },
  {
    id: 12,
    title: 'Electron跨平台桌面应用开发',
    summary: '使用Web技术栈构建跨平台桌面应用的完整指南，包括架构设计和性能优化。',
    author: '张十四',
    publishDate: '2023-04-10',
    imageUrl: 'https://picsum.photos/id/120/800/450',
    tags: ['Electron', '桌面应用', '跨平台']
  }
]);

// 计算当前页显示的文章
const displayedArticles = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return mockArticles.value.slice(startIndex, endIndex);
});

// 页面加载时获取文章
onMounted(async () => {
  await fetchArticles();
});

// 获取文章列表 (使用模拟数据)
const fetchArticles = async () => {
  loading.value = true;
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 使用模拟数据
    articles.value = displayedArticles.value;
    total.value = mockArticles.value.length;
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