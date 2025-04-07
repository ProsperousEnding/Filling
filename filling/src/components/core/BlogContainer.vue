<template>
  <div class="vue-blog-framework flex flex-col h-screen w-screen overflow-hidden fixed inset-0" :class="{ 'dark': config.theme === 'dark' }">
    <!-- 博客主容器 -->
    <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <!-- 头部 -->
      <Header />
      
      <!-- 主体部分 -->
      <main class="blog-container py-4 flex-1 overflow-auto min-h-0">
        <div class="flex flex-col md:flex-row gap-8 min-h-0 h-full">
          <!-- 主内容区域 -->
          <div class="flex-1 order-2 md:order-1 overflow-auto">
            <slot></slot>
          </div>
          
          <!-- 侧边栏 -->
          <div 
            class="w-full md:w-80 order-1 md:order-2 overflow-auto"
            v-show="config.sidebarVisible"
          >
            <Sidebar />
          </div>
        </div>
      </main>
      
      <!-- 底部 -->
      <Footer />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import Header from '../layout/Header.vue'
import Footer from '../layout/Footer.vue'
import Sidebar from '../layout/Sidebar.vue'
import { useConfigStore } from '../../stores/config'

// 配置属性
const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
})

// 获取配置store
const configStore = useConfigStore()
const config = configStore

// 初始化配置
onMounted(() => {
  // 合并默认配置和传入的配置
  if (props.config) {
    configStore.initConfig(props.config)
  }
  
  // 从本地存储加载主题
  configStore.loadThemeFromStorage()
  
  // 如果是深色模式，添加dark类到HTML根元素
  if (config.theme === 'dark') {
    document.documentElement.classList.add('dark')
  }
  
})
</script>

<style scoped>

</style>