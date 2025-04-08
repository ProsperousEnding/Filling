<template>
  <footer class="bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700 mt-auto">
    <div class="blog-container py-8">
      <div class="flex flex-col md:flex-row md:justify-between items-center">
        <!-- 版权信息 -->
        <div class="text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
          {{ config.footerText }}
        </div>
        
        <!-- 链接区域 -->
        <div class="flex space-x-6">
          <a 
            href="javascript:void(0)" 
            class="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
          >
            关于
          </a>
          <a 
            href="javascript:void(0)" 
            class="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
          >
            隐私政策
          </a>
          <a 
            href="javascript:void(0)" 
            class="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
          >
            联系我们
          </a>
        </div>
      </div>
      
      <!-- 底部说明 -->
      <div class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>基于 Vue3 + Pinia + Tailwind CSS 构建</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { useConfigStore } from '../../stores/config'

// 获取配置store
const configStore = useConfigStore()
const config = configStore
</script> 