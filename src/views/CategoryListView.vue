<template>
  <div class="category-list-view">
    <div v-if="loading" class="py-12 flex justify-center">
      <div class="inline-flex items-center text-gray-500">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        加载分类...
      </div>
    </div>
    
    <div v-else>
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          文章分类
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          浏览所有文章分类，发现您感兴趣的内容
        </p>
      </div>
      
      <!-- 分类列表 -->
      <div v-if="categories.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link 
          v-for="category in categories" 
          :key="category.id"
          :to="`/category/${category.id}`"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col"
        >
          <div class="flex items-center mb-3">
            <span class="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 mr-3">
              <svg v-if="category.icon" :class="category.icon" class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </span>
            <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
              {{ category.name }}
            </h2>
          </div>
          
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ category.description || `查看${category.name}分类下的所有文章` }}
          </p>
          
          <div class="mt-auto text-sm text-gray-500 dark:text-gray-400">
            {{ category.articleCount || 0 }} 篇文章
          </div>
        </router-link>
      </div>
      
      <!-- 无分类提示 -->
      <div v-else class="py-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
        <h2 class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">暂无分类</h2>
        <p class="text-gray-500 mb-6">目前没有可用的文章分类</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCategoryStore } from '../stores/category'

// 获取store
const categoryStore = useCategoryStore()

// 状态
const categories = ref([])
const loading = ref(false)

// 生命周期
onMounted(async () => {
  await fetchCategories()
})

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true
  try {
    const result = await categoryStore.fetchAllCategories()
    categories.value = result || []
  } catch (error) {
    console.error('获取分类列表失败:', error)
    categories.value = []
  } finally {
    loading.value = false
  }
}
</script> 