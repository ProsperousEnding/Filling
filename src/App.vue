<template>
  <BlogContainer>
    <router-view />
  </BlogContainer>
  <CustomStyle />
  <CustomScript />
</template>

<script setup>
import BlogContainer from './components/core/BlogContainer.vue'
import CustomStyle from './components/theme/CustomStyle.vue'
import CustomScript from './components/theme/CustomScript.vue'
import { onMounted } from 'vue'
import { useConfigStore } from './stores/config'

const configStore = useConfigStore()

// 初始化主题设置
onMounted(() => {
  // 从本地存储加载主题设置
  configStore.loadThemeFromStorage()
  
  // 应用当前主题预设
  configStore.applyThemePreset(configStore.currentThemePreset)
})
</script>

<style>
@import './style.css';

:root {
  --color-primary: 59, 130, 246; /* 默认主题颜色，会被动态替换 */
  --color-secondary: 107, 114, 128;
  --color-background: 255, 255, 255;
  --color-dark-background: 31, 41, 55;
  --color-content-bg: 255, 255, 255, 0.8;
  --color-dark-content-bg: 31, 41, 55, 0.9;
  --color-text-primary: 17, 24, 39;
  --color-dark-text-primary: 243, 244, 246;
  --color-text-secondary: 107, 114, 128;
  --color-dark-text-secondary: 156, 163, 175;
  --color-border-color: 229, 231, 235;
  --color-dark-border-color: 55, 65, 81;
}

/* 重新定义主题颜色类 */
.text-primary {
  color: rgb(var(--color-primary)) !important;
}

.bg-primary {
  background-color: rgb(var(--color-primary)) !important;
}

.border-primary {
  border-color: rgb(var(--color-primary)) !important;
}

.ring-primary {
  --tw-ring-color: rgb(var(--color-primary)) !important;
}

.hover\:text-primary:hover {
  color: rgb(var(--color-primary)) !important;
}

.hover\:bg-primary:hover {
  background-color: rgb(var(--color-primary)) !important;
}

.focus\:ring-primary:focus {
  --tw-ring-color: rgb(var(--color-primary)) !important;
}

/* 主题背景 */
.dark .dark\:bg-primary {
  background-color: rgb(var(--color-primary)) !important;
}

/* 透明度变体 */
.bg-primary\/10 {
  background-color: rgba(var(--color-primary), 0.1) !important;
}

.bg-primary\/20 {
  background-color: rgba(var(--color-primary), 0.2) !important;
}

.bg-primary\/50 {
  background-color: rgba(var(--color-primary), 0.5) !important;
}

.ring-primary\/50 {
  --tw-ring-color: rgba(var(--color-primary), 0.5) !important;
}

.dark .dark\:bg-primary\/10 {
  background-color: rgba(var(--color-primary), 0.1) !important;
}

.dark .dark\:bg-primary\/20 {
  background-color: rgba(var(--color-primary), 0.2) !important;
}
</style>
