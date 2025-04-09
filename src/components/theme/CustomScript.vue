<template>
  <!-- 这个组件不需要渲染任何内容 -->
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useConfigStore } from '../../stores/config'

const configStore = useConfigStore()
const customJS = computed(() => configStore.customJS)

// 创建脚本元素
let scriptElement = null

// 更新自定义脚本
const updateCustomScript = () => {
  // 先移除旧的脚本元素，如果存在
  if (scriptElement) {
    document.body.removeChild(scriptElement)
    scriptElement = null
  }

  // 如果没有自定义JS，则不添加
  if (!customJS.value || customJS.value.trim() === '') {
    return
  }

  // 创建新的脚本元素
  scriptElement = document.createElement('script')
  scriptElement.type = 'text/javascript'
  scriptElement.id = 'vue-blog-custom-js'
  // 使用 try-catch 包裹以防止注入的脚本错误破坏整个应用
  scriptElement.textContent = `
try {
${customJS.value}
} catch (error) {
console.error("执行自定义脚本时出错:", error);
}
`;
  document.body.appendChild(scriptElement)
}

// 监听自定义JS变化
watch(customJS, updateCustomScript)

// 组件挂载时创建脚本元素
onMounted(() => {
  // 延迟执行，确保body已完全加载
  setTimeout(updateCustomScript, 0)
})

// 组件卸载时移除脚本元素
onUnmounted(() => {
  if (scriptElement) {
    document.body.removeChild(scriptElement)
    scriptElement = null
  }
})
</script> 