<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white font-sf-pro">主题设置</h1>
        <button 
          @click="exportAllConfigs"
          class="px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm hover:bg-primary/20 transition-colors"
        >
          📤 导出所有配置
        </button>
      </div>
      
      <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <!-- 主题选择器标签页 -->
        <div class="mb-6">
          <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="flex flex-wrap space-x-8">
              <button 
                @click="activeTab = 'themes'"
                :class="[
                  'py-3 px-1 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === 'themes' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                ]"
              >
                预设主题
              </button>
              <button 
                @click="activeTab = 'customize'"
                :class="[
                  'py-3 px-1 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === 'customize' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                ]"
              >
                自定义主题
              </button>
              <button 
                @click="activeTab = 'css'"
                :class="[
                  'py-3 px-1 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === 'css' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                ]"
              >
                自定义CSS
              </button>
              <button 
                @click="activeTab = 'js'"
                :class="[
                  'py-3 px-1 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === 'js' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                ]"
              >
                自定义脚本
              </button>
            </nav>
          </div>
        </div>
        
        <!-- 标签页内容 -->
        <Transition name="fade" mode="out-in">
          <!-- 预设主题标签页 -->
          <div v-if="activeTab === 'themes'" class="py-2">
            <ThemeSelector />
          </div>
          
          <!-- 自定义主题标签页 -->
          <div v-else-if="activeTab === 'customize'" class="py-2">
            <ThemeCustomizer />
          </div>
          
          <!-- 自定义CSS标签页 -->
          <div v-else-if="activeTab === 'css'" class="py-2">
            <div class="mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 font-sf-pro">自定义CSS</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                在这里可以添加自定义CSS样式来调整博客的外观。您添加的样式将会应用到整个网站。
              </p>
            </div>
            
            <div class="mb-4">
              <textarea
                v-model="customCSSInput"
                class="w-full h-80 px-4 py-3 text-sm font-mono border border-gray-200 dark:border-gray-700 rounded-lg bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                placeholder="/* 在这里添加您的自定义CSS样式 */\n/* 例如：\n.article-content {\n  font-size: 16px;\n  line-height: 1.8;\n}\n*/"
              ></textarea>
            </div>
            
            <div class="flex justify-end">
              <button 
                @click="saveCustomCSS"
                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                保存CSS
              </button>
            </div>
          </div>
          
          <!-- 自定义脚本标签页 -->
          <div v-else-if="activeTab === 'js'" class="py-2">
            <div class="mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 font-sf-pro">自定义脚本</h3>
              <div class="bg-yellow-100/70 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 rounded-r-lg mb-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-yellow-500 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-yellow-700 dark:text-yellow-200">
                      <strong class="font-medium">安全警告:</strong> 注入自定义JavaScript代码可能带来安全风险（如XSS攻击）或导致网站功能异常。请确保您完全理解所添加代码的作用，并只使用来自可信来源的代码。
                    </p>
                  </div>
                </div>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                在这里添加自定义JavaScript代码，可以用来实现更复杂的交互效果、集成第三方服务或修改页面行为。
              </p>
            </div>
            
            <div class="mb-4">
              <textarea
                v-model="customJSInput"
                class="w-full h-80 px-4 py-3 text-sm font-mono border border-gray-200 dark:border-gray-700 rounded-lg bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                placeholder="// 在这里添加您的自定义JavaScript代码\n// 例如：\n// console.log('自定义脚本已加载！');\n// alert('欢迎来到我的博客！');"
              ></textarea>
            </div>
            
            <div class="flex justify-end">
              <button 
                @click="saveCustomJS"
                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                保存脚本
              </button>
            </div>
          </div>
          
        </Transition>
      </div>
      
      <div class="mt-8">
        <CustomStyle />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useConfigStore } from '../stores/config'
import ThemeSelector from '../components/theme/ThemeSelector.vue'
import ThemeCustomizer from '../components/theme/ThemeCustomizer.vue'
import CustomStyle from '../components/theme/CustomStyle.vue'
import { stringifyToml } from '../utils/tomlParser'

const configStore = useConfigStore()
const activeTab = ref('themes')
const customCSSInput = ref('')
const customJSInput = ref('')

// 保存自定义CSS
const saveCustomCSS = async () => {
  try {
    await configStore.setCustomCSS(customCSSInput.value)
    alert('✅ CSS 配置已保存到 theme.toml 文件！')
  } catch (error) {
    alert('❌ 保存失败：' + error.message)
  }
}

// 保存自定义JS
const saveCustomJS = async () => {
  try {
    await configStore.setCustomJS(customJSInput.value)
    alert('✅ JS 配置已保存到 theme.toml 文件！')
  } catch (error) {
    alert('❌ 保存失败：' + error.message)
  }
}

// 导出所有配置为 TOML 格式
const exportAllConfigs = () => {
  // 导出网站配置
  const siteConfig = {
    title: configStore.blogTitle,
    description: configStore.blogDescription,
    footer_text: configStore.footerText,
    features: {
      show_category_count: configStore.showCategoryCount,
      show_tag_count: configStore.showTagCount,
      show_read_time: configStore.showReadTime,
      enable_comments: configStore.enableComments,
      sidebar_visible: configStore.sidebarVisible
    },
    pagination: {
      page_size: configStore.pageSize
    }
  }
  
  // 导出个人信息配置
  const profileConfig = {
    display_name: configStore.userProfile.displayName,
    username: configStore.userProfile.username,
    tagline: configStore.userProfile.tagline,
    bio: configStore.userProfile.bio,
    avatar_url: configStore.userProfile.avatarUrl,
    location: configStore.userProfile.location,
    website: configStore.userProfile.website,
    social_links: configStore.userProfile.socialLinks.map(link => ({
      label: link.label,
      url: link.url,
      icon: link.icon
    }))
  }
  
  // 导出主题配置
  const themeConfigObj = {
    current_preset: configStore.currentThemePreset,
    custom_css: configStore.customCSS,
    custom_js: configStore.customJS,
    presets: {}
  }
  
  // 转换主题预设
  Object.entries(configStore.themePresets).forEach(([name, preset]) => {
    if (preset && name !== 'custom') {
      themeConfigObj.presets[name] = {}
      Object.entries(preset).forEach(([key, value]) => {
        // 将驼峰命名转换为下划线命名
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        themeConfigObj.presets[name][snakeKey] = value
      })
    }
  })
  
  // 生成 TOML 字符串
  const siteToml = '# 网站基础配置\n' + stringifyToml(siteConfig)
  const profileToml = '# 个人信息配置\n' + stringifyToml(profileConfig)
  const themeToml = '# 主题配置文件\n' + stringifyToml(themeConfigObj)
  
  // 显示导出内容
  const exportContent = `
=== site.toml ===
${siteToml}

=== profile.toml ===
${profileToml}

=== theme.toml ===
${themeToml}
`
  
  // 复制到剪贴板
  navigator.clipboard.writeText(exportContent).then(() => {
    alert('✅ 所有配置已复制到剪贴板！\n请分别粘贴到对应的 TOML 文件中。')
  }).catch(() => {
    // 如果复制失败，显示一个模态框
    const modal = confirm('无法自动复制。是否在控制台查看配置内容？')
    if (modal) {
      console.log(exportContent)
    }
  })
}

// 初始化
onMounted(() => {
  customCSSInput.value = configStore.customCSS || ''
  customJSInput.value = configStore.customJS || ''
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.font-sf-pro {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
}
</style> 