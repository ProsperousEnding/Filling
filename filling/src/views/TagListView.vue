<template>
  <div class="tag-list-view">
    <div v-if="loading" class="py-12 flex justify-center">
      <div class="inline-flex items-center text-gray-500">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        加载标签...
      </div>
    </div>
    
    <div v-else>
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          文章标签
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          浏览所有文章标签，探索您感兴趣的话题
        </p>
      </div>
      
      <!-- 标签统计 -->
      <div class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        共 {{ tags.length }} 个标签
      </div>
      
      <!-- 标签云 -->
      <div v-if="tags.length > 0" class="flex flex-wrap gap-3 mb-12">
        <router-link 
          v-for="tag in tags" 
          :key="tag.id"
          :to="`/tag/${tag.id}`"
          class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors"
          :class="getTagClass(tag.articleCount)"
        >
          <span>{{ tag.name }}</span>
          <span class="ml-2 px-2 py-0.5 rounded-full bg-white dark:bg-gray-700 text-xs">
            {{ tag.articleCount || 0 }}
          </span>
        </router-link>
      </div>
      
      <!-- 分组展示 (字母排序) -->
      <div v-if="tags.length > 0">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          按字母排序
        </h2>
        
        <div class="space-y-8">
          <div 
            v-for="group in groupedTags" 
            :key="group.letter"
            class="border-t pt-4 border-gray-200 dark:border-gray-700"
          >
            <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
              {{ group.letter }}
            </h3>
            
            <div class="flex flex-wrap gap-3">
              <router-link 
                v-for="tag in group.tags" 
                :key="tag.id"
                :to="`/tag/${tag.id}`"
                class="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {{ tag.name }}
                <span class="ml-1 text-gray-500 text-xs">({{ tag.articleCount || 0 }})</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 无标签提示 -->
      <div v-else class="py-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <h2 class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">暂无标签</h2>
        <p class="text-gray-500 mb-6">目前没有可用的文章标签</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTagStore } from '../stores/tag'

// 获取store
const tagStore = useTagStore()

// 状态
const tags = ref([])
const loading = ref(false)

// 生命周期
onMounted(async () => {
  await fetchTags()
})

// 获取标签列表
const fetchTags = async () => {
  loading.value = true
  try {
    const result = await tagStore.fetchAllTags()
    tags.value = result || []
  } catch (error) {
    console.error('获取标签列表失败:', error)
    tags.value = []
  } finally {
    loading.value = false
  }
}

// 获取标签样式类
const getTagClass = (count) => {
  if (!count) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  
  // 根据文章数量设置不同的颜色
  if (count >= 20) {
    return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
  } else if (count >= 10) {
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
  } else if (count >= 5) {
    return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
  } else {
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
  }
}

// 按字母分组标签
const groupedTags = computed(() => {
  const groups = {}
  
  // 确保tags是数组
  const tagsArray = Array.isArray(tags.value) ? tags.value : []
  
  // 首先按名称排序
  const sortedTags = [...tagsArray].sort((a, b) => {
    return a.name.localeCompare(b.name, 'zh-CN')
  })
  
  // 然后按首字母分组
  sortedTags.forEach(tag => {
    // 获取首字母（大写）
    const firstChar = tag.name.charAt(0).toUpperCase()
    const letter = /[A-Z]/.test(firstChar) ? firstChar : '#'
    
    if (!groups[letter]) {
      groups[letter] = {
        letter,
        tags: []
      }
    }
    
    groups[letter].tags.push(tag)
  })
  
  // 转换为数组并按字母顺序排序
  return Object.values(groups).sort((a, b) => {
    // 特殊字符放在最后
    if (a.letter === '#') return 1
    if (b.letter === '#') return -1
    return a.letter.localeCompare(b.letter)
  })
})
</script> 