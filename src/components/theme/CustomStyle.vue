<template>
  <!-- 这个组件不需要渲染任何内容 -->
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useConfigStore } from '../../stores/config'

const configStore = useConfigStore()
const customCSS = computed(() => configStore.customCSS)

// 创建样式元素
let styleElement = null

// 更新自定义样式
const updateCustomStyle = () => {
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.type = 'text/css'
    styleElement.id = 'vue-blog-custom-css'
    document.head.appendChild(styleElement)
  }
  
  styleElement.textContent = customCSS.value || ''
}

// 监听自定义CSS变化
watch(customCSS, updateCustomStyle)

// 组件挂载时创建样式元素
onMounted(() => {
  updateCustomStyle()
})

// 组件卸载时移除样式元素
onUnmounted(() => {
  if (styleElement) {
    document.head.removeChild(styleElement)
    styleElement = null
  }
})
</script> 