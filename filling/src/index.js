// 导入组件
import BlogContainer from './components/core/BlogContainer.vue'
import ArticleCard from './components/core/ArticleCard.vue'
import ArticleList from './components/core/ArticleList.vue'
import CommentSystem from './components/core/CommentSystem.vue'
import TagCloud from './components/core/TagCloud.vue'
import Pagination from './components/core/Pagination.vue'

// 导入布局组件
import Header from './components/layout/Header.vue'
import Footer from './components/layout/Footer.vue'
import Sidebar from './components/layout/Sidebar.vue'

// 导入视图组件
import Home from './views/Home.vue'
import ArticleListView from './views/ArticleList.vue'
import ArticleDetailView from './views/ArticleDetail.vue'

// 导入存储
import { useArticleStore } from './stores/article'
import { useCategoryStore } from './stores/category'
import { useTagStore } from './stores/tag'
import { useCommentStore } from './stores/comment'
import { useConfigStore } from './stores/config'
import { useSearchStore } from './stores/search'

// 导入样式
import './style.css'

// 插件安装函数
const install = (app, options = {}) => {
  // 注册全局组件
  app.component('BlogContainer', BlogContainer)
  app.component('ArticleCard', ArticleCard)
  app.component('ArticleList', ArticleList)
  app.component('CommentSystem', CommentSystem)
  app.component('TagCloud', TagCloud)
  app.component('Pagination', Pagination)
  app.component('BlogHeader', Header)
  app.component('BlogFooter', Footer)
  app.component('BlogSidebar', Sidebar)
  
  // 初始化配置（将在BlogContainer组件挂载时执行）
  const configStore = useConfigStore()
  if (options) {
    configStore.initConfig(options)
  }
}

// 导出组件
export {
  BlogContainer,
  ArticleCard,
  ArticleList,
  CommentSystem,
  TagCloud,
  Pagination,
  Header as BlogHeader,
  Footer as BlogFooter,
  Sidebar as BlogSidebar,
  Home,
  ArticleListView,
  ArticleDetailView,
  useArticleStore,
  useCategoryStore,
  useTagStore,
  useCommentStore,
  useConfigStore,
  useSearchStore
}

// 默认导出
export default {
  install
} 