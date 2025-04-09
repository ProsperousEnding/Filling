<template>
  <div class="theme-customizer">
    <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-5 font-sf-pro">主题自定义</h2>
    
    <!-- 颜色选择器面板 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div v-for="(group, groupName) in colorGroups" :key="groupName" class="p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700">
        <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-4 font-sf-pro">{{ groupLabels[groupName] }}</h3>
        <div class="space-y-4">
          <div v-for="item in group" :key="item.key" class="flex items-center">
            <label :for="item.key" class="text-sm text-gray-700 dark:text-gray-300 flex-grow">{{ item.label }}</label>
            <div class="flex items-center space-x-2">
              <input 
                :id="item.key"
                type="color"
                :value="rgbToHex(customTheme[item.key] || '255, 255, 255')"
                @input="updateColor(item.key, $event.target.value)"
                class="w-8 h-8 rounded-md border-0 cursor-pointer"
              />
              <input 
                type="text"
                :value="rgbToHex(customTheme[item.key] || '255, 255, 255')"
                @input="updateColor(item.key, $event.target.value)"
                class="w-20 text-sm px-2 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 预览区域 -->
    <div class="mb-6 p-5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
      <h3 class="text-base font-medium text-gray-800 dark:text-gray-200 mb-3 font-sf-pro">预览效果</h3>
      <div class="preview-container p-4 rounded-lg" :style="previewContainerStyle">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-medium">预览</div>
          <div>
            <div class="text-sm font-medium" :style="previewTextStyle">主标题文本</div>
            <div class="text-xs" :style="previewSecondaryTextStyle">副标题描述文本</div>
          </div>
        </div>
        <div class="flex space-x-2 mb-3">
          <button class="px-3 py-1 rounded-full text-xs bg-primary text-white">主要按钮</button>
          <button class="px-3 py-1 rounded-full text-xs" :style="previewSecondaryButtonStyle">次要按钮</button>
        </div>
        <div :style="previewCardStyle" class="p-3 rounded-lg">
          <div class="text-sm font-medium mb-1" :style="previewTextStyle">卡片内容标题</div>
          <div class="text-xs" :style="previewSecondaryTextStyle">这是卡片内的内容描述文本，展示了自定义主题效果。</div>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="flex justify-end space-x-3">
      <button 
        @click="resetCustomTheme" 
        class="px-4 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        重置
      </button>
      <button 
        @click="saveTheme" 
        class="px-4 py-2 rounded-lg text-sm bg-primary text-white hover:bg-primary/90 transition-colors"
      >
        保存为自定义主题
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue'
import { useConfigStore } from '../../stores/config'

const configStore = useConfigStore()

// 颜色分组和标签
const colorGroups = {
  main: [
    { key: 'primary', label: '主题色' },
    { key: 'secondary', label: '次要色' }
  ],
  background: [
    { key: 'background', label: '背景色（亮）' },
    { key: 'darkBackground', label: '背景色（暗）' },
    { key: 'contentBg', label: '内容背景（亮）' },
    { key: 'darkContentBg', label: '内容背景（暗）' }
  ],
  text: [
    { key: 'textPrimary', label: '主要文字（亮）' },
    { key: 'darkTextPrimary', label: '主要文字（暗）' },
    { key: 'textSecondary', label: '次要文字（亮）' },
    { key: 'darkTextSecondary', label: '次要文字（暗）' }
  ],
  border: [
    { key: 'borderColor', label: '边框颜色（亮）' },
    { key: 'darkBorderColor', label: '边框颜色（暗）' }
  ]
}

const groupLabels = {
  main: '主题颜色',
  background: '背景颜色',
  text: '文字颜色',
  border: '边框颜色'
}

// 自定义主题状态
const customTheme = reactive({})

// 初始化自定义主题值
const initCustomTheme = () => {
  const presetToUse = configStore.themePresets.custom || configStore.themePresets[configStore.currentThemePreset]
  
  Object.entries(presetToUse).forEach(([key, value]) => {
    customTheme[key] = value
  })
}

// 重置自定义主题
const resetCustomTheme = () => {
  initCustomTheme()
  // 重置时也要应用所有颜色变量
  Object.entries(customTheme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--color-${key}`, value)
  })
}

// 更新颜色值
const updateColor = (key, value) => {
  try {
    // 如果是十六进制格式，转换为RGB
    if (value.startsWith('#')) {
      const rgb = hexToRgb(value)
      if (rgb) {
        customTheme[key] = `${rgb.r}, ${rgb.g}, ${rgb.b}`
        // 实时应用颜色变化到CSS变量
        document.documentElement.style.setProperty(`--color-${key}`, customTheme[key])
      }
    } else {
      customTheme[key] = value
      // 实时应用颜色变化到CSS变量
      document.documentElement.style.setProperty(`--color-${key}`, value)
    }
  } catch (e) {
    console.error('颜色格式无效', e)
  }
}

// 保存主题
const saveTheme = () => {
  configStore.saveCustomTheme(customTheme)
  configStore.setThemePreset('custom')
}

// 颜色格式转换：RGB字符串转十六进制
const rgbToHex = (rgb) => {
  try {
    const [r, g, b] = rgb.split(',').map(val => parseInt(val.trim(), 10))
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  } catch (e) {
    console.error('RGB转HEX失败', e)
    return '#FFFFFF'
  }
}

// 颜色格式转换：十六进制转RGB对象
const hexToRgb = (hex) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b)
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// 生成预览样式
const isDarkMode = computed(() => configStore.theme === 'dark')

const previewContainerStyle = computed(() => ({
  backgroundColor: `rgba(${isDarkMode.value ? customTheme.darkBackground : customTheme.background})`,
  color: `rgba(${isDarkMode.value ? customTheme.darkTextPrimary : customTheme.textPrimary})`,
  borderColor: `rgba(${isDarkMode.value ? customTheme.darkBorderColor : customTheme.borderColor})`,
  border: '1px solid'
}))

const previewCardStyle = computed(() => ({
  backgroundColor: `rgba(${isDarkMode.value ? customTheme.darkContentBg : customTheme.contentBg})`,
  borderColor: `rgba(${isDarkMode.value ? customTheme.darkBorderColor : customTheme.borderColor})`,
  border: '1px solid'
}))

const previewTextStyle = computed(() => ({
  color: `rgba(${isDarkMode.value ? customTheme.darkTextPrimary : customTheme.textPrimary})`
}))

const previewSecondaryTextStyle = computed(() => ({
  color: `rgba(${isDarkMode.value ? customTheme.darkTextSecondary : customTheme.textSecondary})`
}))

const previewSecondaryButtonStyle = computed(() => ({
  backgroundColor: `rgba(${customTheme.secondary}, 0.1)`,
  color: `rgba(${customTheme.secondary}, 1)`
}))

// 组件卸载时恢复原始主题
onUnmounted(() => {
  // 恢复到之前的主题预设
  configStore.applyThemePreset(configStore.currentThemePreset)
})

// 组件挂载时初始化
onMounted(() => {
  initCustomTheme()
  // 初始化时应用所有颜色变量
  Object.entries(customTheme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--color-${key}`, value)
  })
})

// 监听主题模式变化
watch(() => configStore.theme, () => {
  // 刷新预览
})
</script>

<style scoped>
.theme-customizer {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
}

/* 修改颜色选择器样式 */
input[type="color"] {
  appearance: none;
  -webkit-appearance: none;
  padding: 0;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}
</style> 