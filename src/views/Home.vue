<template>
  <div class="home-view">
    <!-- 页面标题 -->
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">最新文章</h1>
    
    <!-- 文章列表 - 使用首页专用列表组件 -->
    <article-list-view 
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
import ArticleListView from '../components/core/ArticleListView.vue'

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
const pageSize = ref(configStore.pageSize || 8)

// 模拟文章数据
const mockArticles = ref([
  {
    id: 1,
    title: '前端框架对比：Vue、React与Angular',
    summary: '详细分析三大主流前端框架的优缺点，帮助你为项目选择最合适的技术栈。',
    author: '林一',
    publishDate: '2023-07-01',
    imageUrl: 'https://picsum.photos/id/1/800/450',
    readTime: '10分钟',
    tags: ['前端', '框架对比'],
    category: { id: 1, name: '前端开发' }
  },
  {
    id: 2,
    title: '2023年Web开发趋势预测',
    summary: '基于行业数据和专家观点，探讨2023年Web开发领域的关键趋势和技术变革。',
    author: '王二',
    publishDate: '2023-06-28',
    imageUrl: 'https://picsum.photos/id/2/800/450',
    readTime: '8分钟',
    tags: ['Web开发', '技术趋势']
  },
  {
    id: 3,
    title: '从零开始学习TypeScript',
    summary: 'TypeScript入门教程，带你掌握类型系统、接口、泛型等核心概念，提升代码质量。',
    author: '张三',
    publishDate: '2023-06-25',
    imageUrl: 'https://picsum.photos/id/3/800/450',
    readTime: '15分钟',
    tags: ['TypeScript', '编程语言']
  },
  {
    id: 4,
    title: 'CSS变量：现代Web样式的强大工具',
    summary: '深入了解CSS变量（自定义属性）的使用方法，以及如何利用它们构建灵活的样式系统。',
    author: '李四',
    publishDate: '2023-06-20',
    imageUrl: 'https://picsum.photos/id/4/800/450',
    readTime: '7分钟',
    tags: ['CSS', '前端样式']
  },
  {
    id: 5,
    title: 'Node.js性能调优实战指南',
    summary: '从内存管理到异步优化，全方位提升你的Node.js应用性能的实用技巧和工具。',
    author: '王五',
    publishDate: '2023-06-15',
    imageUrl: 'https://picsum.photos/id/5/800/450',
    readTime: '12分钟',
    tags: ['Node.js', '性能优化']
  },
  {
    id: 6,
    title: '前端安全最佳实践',
    summary: '前端开发中常见的安全漏洞及其防御策略，帮助你构建更安全的Web应用。',
    author: '赵六',
    publishDate: '2023-06-10',
    imageUrl: 'https://picsum.photos/id/6/800/450',
    readTime: '9分钟',
    tags: ['Web安全', '前端']
  },
  {
    id: 7,
    title: 'Vue3源码解析：响应式系统',
    summary: '深入Vue3的响应式系统实现原理，了解Proxy和Reflect如何支撑现代化的数据响应。',
    author: '钱七',
    publishDate: '2023-06-05',
    imageUrl: 'https://picsum.photos/id/7/800/450',
    readTime: '20分钟',
    tags: ['Vue', '源码分析']
  },
  {
    id: 8,
    title: 'JavaScript异步编程演进史',
    summary: '从回调地狱到Promise，再到async/await，JavaScript异步编程范式的完整演进历程。',
    author: '孙八',
    publishDate: '2023-05-30',
    imageUrl: 'https://picsum.photos/id/8/800/450',
    readTime: '11分钟',
    tags: ['JavaScript', '异步编程']
  },
  {
    id: 9,
    title: 'Web性能优化：关键指标与工具',
    summary: '了解核心Web性能指标及其对用户体验的影响，掌握性能分析和优化的专业工具。',
    author: '周九',
    publishDate: '2023-05-25',
    imageUrl: 'https://picsum.photos/id/9/800/450',
    readTime: '13分钟',
    tags: ['性能优化', 'Web开发']
  },
  {
    id: 10,
    title: 'GraphQL与REST API设计比较',
    summary: '深入对比GraphQL与REST API的设计理念、优缺点及适用场景，助你做出明智的技术选择。',
    author: '吴十',
    publishDate: '2023-05-20',
    imageUrl: 'https://picsum.photos/id/10/800/450',
    readTime: '14分钟',
    tags: ['API设计', 'GraphQL', 'REST']
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
    await new Promise(resolve => setTimeout(resolve, 600));
    
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