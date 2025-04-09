<template>
  <aside class="sidebar-container backdrop-blur-md bg-white/80 dark:bg-gray-800/90 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
    <!-- 侧边栏切换按钮（仅在移动端显示） -->
    <div class="md:hidden flex justify-end mb-4">
      <button 
        @click="toggleSidebar" 
        class="text-gray-500 hover:text-primary transition-colors duration-200 active:scale-95"
        aria-label="关闭侧边栏"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <!-- 个人信息 -->
    <div class="text-center mb-8">
      <div class="avatar-container inline-block relative h-24 w-24 mb-4">
        <div class="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-blue-500/20 animate-gradient-slow"></div>
        <div class="h-24 w-24 rounded-full overflow-hidden shadow-md ring-2 ring-gray-100 dark:ring-gray-700">
          <img 
            v-if="config.avatarUrl"
            :src="config.avatarUrl" 
            :alt="config.blogTitle + '的头像'"
            class="h-full w-full object-cover"
            loading="lazy"
            @error="handleImageError"
          />
          <div v-else class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <span class="text-2xl font-sf-pro text-primary">{{ getAvatarInitial(config.blogTitle) }}</span>
          </div>
        </div>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 font-sf-pro">{{ config.blogTitle }}</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 font-sf-pro">{{ config.blogDescription }}</p>
    </div>
    
    <!-- 搜索框 -->
    <div class="mb-8">
      <div class="relative search-container">
        <input 
          type="text"
          v-model="searchKeyword"
          @keyup.enter="handleSearch"
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          placeholder="搜索文章..."
          class="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-700 rounded-full bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 font-sf-pro"
          :class="{'ring-2 ring-primary/30': searchFocused}"
        />
        <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>
    
    <!-- 无数据提示 - 当所有数据都为空时显示 -->
    <div v-if="!isLoading && categories.length === 0 && tags.length === 0 && hotArticles.length === 0" 
         class="py-6 px-4 text-center text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto mb-2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="text-sm font-sf-pro">暂无数据</p>
      <p class="text-xs mt-1">请添加分类、标签或文章</p>
    </div>
    
    <!-- 数据加载中提示 -->
    <div v-else-if="isLoading" class="flex justify-center py-8">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- 有数据时显示相应区块 -->
    <template v-else>
      <!-- 分类列表 -->
      <SidebarSection 
        v-if="categories.length > 0"
        title="分类" 
        :items="categories.length" 
        class="mb-6"
      >
        <ul class="space-y-2.5">
          <li v-for="category in categories" :key="category.id">
            <router-link 
              :to="`/category/${category.id}`" 
              class="flex justify-between items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors duration-200 py-1.5 px-3 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 font-sf-pro group"
              active-class="bg-primary/5 text-primary dark:bg-primary/10"
            >
              <span class="group-hover:translate-x-0.5 transition-transform duration-200">{{ category.name }}</span>
              <span v-if="config.showCategoryCount" class="text-xs bg-gray-100/70 dark:bg-gray-700/70 backdrop-blur-sm px-2 py-0.5 rounded-full">{{ category.count }}</span>
            </router-link>
          </li>
        </ul>
      </SidebarSection>
      
      <!-- 标签云 -->
      <SidebarSection 
        v-if="tags.length > 0"
        title="标签" 
        :items="tags.length" 
        class="mb-6"
      >
        <div class="flex flex-wrap gap-2">
          <router-link 
            v-for="tag in tags" 
            :key="tag.id" 
            :to="`/tag/${tag.id}`"
            class="px-3 py-1.5 bg-gray-100/70 dark:bg-gray-700/70 backdrop-blur-sm text-sm text-gray-700 dark:text-gray-300 rounded-full hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary transition-all duration-200 font-sf-pro transform hover:-translate-y-0.5"
            active-class="bg-primary/10 text-primary dark:bg-primary/20"
          >
            {{ tag.name }}
            <span v-if="config.showTagCount" class="text-xs opacity-70">({{ tag.count }})</span>
          </router-link>
        </div>
      </SidebarSection>
      
      <!-- 热门文章 -->
      <SidebarSection 
        v-if="hotArticles.length > 0"
        title="热门文章"
        :items="hotArticles.length"
        class="mb-2"
      >
        <Transition name="fade" mode="out-in">
          <div v-if="isLoading && hotArticles.length === 0" class="flex justify-center py-4">
            <div class="loading-spinner"></div>
          </div>
          <ul v-else class="space-y-4">
            <li v-for="article in hotArticles" :key="article.id" class="group">
              <router-link 
                :to="`/article/${article.id}`" 
                class="block p-3 rounded-xl transition-all duration-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
              >
                <h5 class="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary line-clamp-2 font-sf-pro">{{ article.title }}</h5>
                <div class="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {{ article.views }}
                  </span>
                  <span class="mx-1.5">·</span>
                  <span class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ formatDate(article.createdAt) }}
                  </span>
                </div>
              </router-link>
            </li>
          </ul>
        </Transition>
      </SidebarSection>
    </template>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '../../stores/config'
import { useCategoryStore } from '../../stores/category'
import { useTagStore } from '../../stores/tag'
import { useArticleStore } from '../../stores/article'

// 异步组件加载
const SidebarSection = defineAsyncComponent(() => 
  import('./SidebarSection.vue')
)

const router = useRouter()
const configStore = useConfigStore()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()
const articleStore = useArticleStore()

const config = configStore
const categories = ref([])
const tags = ref([])
const hotArticles = ref([])
const searchKeyword = ref('')
const searchFocused = ref(false)
const isLoading = ref(true)

// 切换侧边栏
const toggleSidebar = () => {
  configStore.toggleSidebar()
}

// 获取名称首字母作为头像占位符
const getAvatarInitial = (name) => {
  return name && name.charAt(0).toUpperCase()
}

// 图片加载错误处理
const handleImageError = (e) => {
  e.target.style.display = 'none'
  e.target.nextElementSibling.style.display = 'flex'
}

// 搜索处理
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ 
      path: '/search', 
      query: { keyword: searchKeyword.value.trim() } 
    })
    searchKeyword.value = ''
  }
}

// 格式化日期
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  } catch (error) {
    console.error('日期格式化错误', error)
    return '未知日期'
  }
}

// 加载数据
onMounted(async () => {
  isLoading.value = true
  try {
    // 并行加载数据
    const [categoriesData, tagsData, hotArticlesData] = await Promise.all([
      categoryStore.fetchCategories(),
      tagStore.fetchTags(),
      articleStore.fetchHotArticles(5)
    ])
    
    // 过滤无效分类，确保分类项同时具有 id 和 name
    const validCategories = (categoriesData || []).filter(cat => cat && cat.id && cat.name);
    
    categories.value = validCategories; // 使用过滤后的有效分类
    tags.value = tagsData || [];
    hotArticles.value = hotArticlesData || [];
  } catch (error) {
    console.error('加载侧边栏数据失败:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.font-sf-pro {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
}

.sidebar-container {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}

@supports (backdrop-filter: blur(20px)) {
  aside {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
}

/* 确保在不支持backdrop-filter的浏览器上有更高的背景不透明度 */
@supports not (backdrop-filter: blur(20px)) {
  aside {
    background-color: rgba(255, 255, 255, 0.95);
  }
  .dark aside {
    background-color: rgba(31, 41, 55, 0.95);
  }
}

.loading-spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid rgba(var(--color-primary), 0.2);
  border-top-color: rgb(var(--color-primary));
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.avatar-container {
  isolation: isolate;
}

.animate-gradient-slow {
  animation: gradient 8s ease infinite;
  background-size: 200% 200%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style> 