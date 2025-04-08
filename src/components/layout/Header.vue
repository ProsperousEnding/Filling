<template>
  <header class="backdrop-blur-md bg-white/80 dark:bg-gray-800/90 sticky top-0 z-50 transition-all duration-300">
    <div class="blog-container py-3">
      <div class="flex items-center justify-between">
        <!-- 博客标题区域 - Mac风格 -->
        <div class="flex items-center space-x-3">
          <div class="flex space-x-1.5 items-center mr-2">
            <div class="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"></div>
            <div class="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"></div>
          </div>
          <router-link to="/" class="text-xl font-medium text-primary hover:text-blue-700 transition-colors">
            {{ config.blogTitle }}
          </router-link>
          <p v-if="config.blogDescription" class="hidden md:block text-sm text-gray-500 dark:text-gray-400 font-light">
            {{ config.blogDescription }}
          </p>
        </div>
        
        <!-- 导航菜单 - Mac风格导航 -->
        <nav class="hidden md:flex items-center">
          <div class="bg-gray-100/80 dark:bg-gray-700/50 rounded-full px-1 py-1 flex items-center">
            <router-link 
              v-for="(item, index) in navItems" 
              :key="item.path" 
              :to="item.path" 
              class="relative px-4 py-1.5 text-sm rounded-full transition-all duration-200"
              :class="[$route.path === item.path ? 'text-gray-800 dark:text-white bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100']"
            >
              {{ item.name }}
            </router-link>
          </div>
        </nav>
        
        <!-- 操作区 - Mac风格图标 -->
        <div class="flex items-center space-x-3">
          <!-- 搜索按钮 -->
          <router-link to="/search" class="p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </router-link>
          
          <!-- 主题切换按钮 -->
          <button @click="toggleTheme" class="p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
            <svg v-if="config.theme === 'light'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          
          <!-- 移动端菜单按钮 -->
          <button @click="toggleMobileMenu" class="md:hidden p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 移动端菜单 -->
    <div v-if="mobileMenuOpen" class="md:hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur-md transition-all duration-300 border-t dark:border-gray-700">
      <div class="blog-container py-3">
        <nav class="flex flex-col space-y-2">
          <router-link 
            v-for="item in navItems" 
            :key="item.path" 
            :to="item.path" 
            class="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            @click="mobileMenuOpen = false"
          >
            {{ item.name }}
          </router-link>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useConfigStore } from '../../stores/config'
import { useRoute } from 'vue-router'

// 获取当前路由
const $route = useRoute()

// 移动端菜单控制
const mobileMenuOpen = ref(false)
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

// 获取配置store
const configStore = useConfigStore()
const config = configStore

// 主题切换
const toggleTheme = () => {
  configStore.toggleTheme()
}

// 导航菜单项
const navItems = [
  { name: '首页', path: '/' },
  { name: '文章', path: '/articles' },
  { name: '分类', path: '/category' },
  { name: '标签', path: '/tag' },
  { name: '归档', path: '/archive' }
]
</script>

<style scoped>
/* 为Mac风格添加一些微妙阴影和过渡效果 */
header {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

@supports (backdrop-filter: blur(12px)) {
  header {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}
</style> 