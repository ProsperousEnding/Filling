<template>
  <div class="theme-selector">
    <!-- 主题预设选择 -->
    <div class="mb-6">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 font-sf-pro">选择主题</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(preset, name) in themePresets"
          :key="name"
          @click="selectTheme(name)"
          :class="[
            'px-3 py-1.5 rounded-full text-sm transition-all duration-200 transform hover:-translate-y-0.5',
            currentThemePreset === name 
              ? 'ring-2 ring-primary/50 bg-primary/10 text-primary' 
              : 'bg-gray-100/70 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300 hover:bg-primary/10 hover:text-primary'
          ]"
          v-show="name !== 'custom' || (name === 'custom' && preset)"
        >
          <span class="capitalize">{{ themeNames[name] || name }}</span>
        </button>
      </div>
    </div>
    
    <!-- 自定义CSS编辑器 -->
    <div>
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 font-sf-pro">自定义CSS</h3>
        <button 
          @click="saveCustomCSS"
          class="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors duration-200"
        >
          保存
        </button>
      </div>
      <textarea
        v-model="cssInput"
        class="w-full h-32 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 font-mono"
        placeholder="/* 在这里输入您的自定义CSS */"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfigStore } from '../../stores/config'

const configStore = useConfigStore()

// 主题预设
const themePresets = computed(() => configStore.themePresets)
const currentThemePreset = computed(() => configStore.currentThemePreset)

// 主题名称映射
const themeNames = {
  default: '默认主题',
  ocean: '海洋蓝',
  forest: '森林绿',
  custom: '自定义主题'
}

// CSS输入
const cssInput = ref('')

// 选择主题
const selectTheme = (name) => {
  configStore.setThemePreset(name)
}

// 保存自定义CSS
const saveCustomCSS = () => {
  configStore.setCustomCSS(cssInput.value)
}

// 组件加载时初始化
onMounted(() => {
  cssInput.value = configStore.customCSS
})
</script>

<style scoped>
.theme-selector {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
}
</style> 