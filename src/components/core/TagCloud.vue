<template>
  <div class="tag-cloud">
    <!-- 标题 -->
    <h3 v-if="title" class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{{ title }}</h3>
    
    <!-- 标签云内容 -->
    <div v-if="loading" class="flex justify-center py-4">
      <div class="inline-flex items-center text-gray-500">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        加载中...
      </div>
    </div>
    
    <div v-else-if="tags.length === 0" class="text-center py-4 text-gray-500">
      暂无标签
    </div>
    
    <div v-else class="flex flex-wrap gap-2">
      <router-link 
        v-for="tag in tags" 
        :key="tag.id" 
        :to="`/tag/${tag.id}`" 
        class="tag"
        :style="tagStyle(tag)"
      >
        {{ tag.name }}
        <span v-if="showCount">({{ tag.count }})</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../../stores/config'

// 组件属性
const props = defineProps({
  tags: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  maxFontSize: {
    type: Number,
    default: 18
  },
  minFontSize: {
    type: Number,
    default: 12
  },
  colorful: {
    type: Boolean,
    default: false
  }
})

// 获取配置
const configStore = useConfigStore()
const showCount = computed(() => configStore.showTagCount)

// 标签样式计算
const tagStyle = (tag) => {
  if (props.tags.length <= 1 || !tag.count) {
    return {}
  }
  
  // 根据数量确定字体大小
  const counts = props.tags.map(t => t.count)
  const maxCount = Math.max(...counts)
  const minCount = Math.min(...counts)
  
  let fontSize = props.minFontSize
  if (maxCount !== minCount) {
    const range = props.maxFontSize - props.minFontSize
    fontSize = props.minFontSize + range * (tag.count - minCount) / (maxCount - minCount)
  }
  
  const style = { fontSize: `${fontSize}px` }
  
  // 如果启用了彩色模式，根据频率添加不同的颜色
  if (props.colorful) {
    const colors = [
      '#3b82f6', // primary
      '#10b981', // secondary
      '#6366f1', // indigo
      '#ec4899', // pink
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6'  // purple
    ]
    const index = Math.floor(counts.indexOf(tag.count) % colors.length)
    style.color = colors[index]
    style.borderColor = colors[index]
  }
  
  return style
}
</script> 