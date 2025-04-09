import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', {
  state: () => ({
    theme: 'light',
    sidebarVisible: true,
    apiBaseUrl: '/api',
    pageSize: 10,
    blogTitle: 'Vue博客框架',
    blogDescription: '一个基于Vue3的可集成博客框架',
    footerText: '© 2025 Vue博客框架',
    showCategoryCount: true,
    showTagCount: true,
    showReadTime: true,
    enableComments: true,
    // 自定义CSS
    customCSS: '',
    // 当前使用的预设主题
    currentThemePreset: 'default',
    // 主题预设配置
    themePresets: {
      default: {
        primary: '59, 130, 246', // Blue-500
        secondary: '107, 114, 128', // Gray-500
        background: '255, 255, 255', // White
        darkBackground: '31, 41, 55', // Gray-800
        contentBg: '255, 255, 255, 0.8', // 半透明白色
        darkContentBg: '31, 41, 55, 0.9', // 半透明暗色
        textPrimary: '17, 24, 39', // Gray-900
        darkTextPrimary: '243, 244, 246', // Gray-100
        textSecondary: '107, 114, 128', // Gray-500
        darkTextSecondary: '156, 163, 175', // Gray-400
        borderColor: '229, 231, 235', // Gray-200
        darkBorderColor: '55, 65, 81' // Gray-700
      },
      ocean: {
        primary: '6, 182, 212', // Cyan-500
        secondary: '45, 212, 191', // Teal-400
        background: '240, 249, 255', // Sky-50
        darkBackground: '15, 23, 42', // Slate-900
        contentBg: '240, 249, 255, 0.8', // 半透明背景
        darkContentBg: '15, 23, 42, 0.9', // 半透明暗色
        textPrimary: '15, 23, 42', // Slate-900
        darkTextPrimary: '241, 245, 249', // Slate-100
        textSecondary: '71, 85, 105', // Slate-600
        darkTextSecondary: '148, 163, 184', // Slate-400
        borderColor: '226, 232, 240', // Slate-200
        darkBorderColor: '51, 65, 85' // Slate-700
      },
      forest: {
        primary: '34, 197, 94', // Green-500
        secondary: '16, 185, 129', // Emerald-500
        background: '240, 253, 244', // Green-50
        darkBackground: '20, 83, 45', // Green-900
        contentBg: '240, 253, 244, 0.8', // 半透明背景
        darkContentBg: '20, 83, 45, 0.9', // 半透明暗色
        textPrimary: '20, 83, 45', // Green-900
        darkTextPrimary: '240, 253, 244', // Green-50
        textSecondary: '34, 197, 94', // Green-500
        darkTextSecondary: '110, 231, 183', // Emerald-300
        borderColor: '220, 252, 231', // Green-100
        darkBorderColor: '22, 101, 52' // Green-800
      },
      // 用户自定义主题
      custom: null
    },
    // 自定义JS
    customJS: ''
  }),
  
  actions: {
    // 初始化配置
    initConfig(config = {}) {
      this.$patch(config)
      // 初始化时应用当前主题预设
      this.applyThemePreset(this.currentThemePreset)
    },
    
    // 切换明暗主题
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      
      // 更新HTML根元素的class
      document.documentElement.classList.toggle('dark', this.theme === 'dark')
      
      // 将主题保存到本地存储
      localStorage.setItem('vue-blog-theme', this.theme)
    },
    
    // 切换侧边栏
    toggleSidebar() {
      this.sidebarVisible = !this.sidebarVisible
    },
    
    // 从本地存储加载主题设置
    loadThemeFromStorage() {
      // 加载明暗主题设置
      const savedTheme = localStorage.getItem('vue-blog-theme')
      if (savedTheme) {
        this.theme = savedTheme
        document.documentElement.classList.toggle('dark', this.theme === 'dark')
      }
      
      // 加载主题预设
      const savedThemePreset = localStorage.getItem('vue-blog-theme-preset')
      if (savedThemePreset && this.themePresets[savedThemePreset]) {
        this.currentThemePreset = savedThemePreset
        this.applyThemePreset(savedThemePreset)
      }
      
      // 加载自定义CSS
      const savedCustomCSS = localStorage.getItem('vue-blog-custom-css')
      if (savedCustomCSS) {
        this.customCSS = savedCustomCSS
      }
      
      // 加载自定义JS
      const savedCustomJS = localStorage.getItem('vue-blog-custom-js')
      if (savedCustomJS) {
        this.customJS = savedCustomJS
      }
      
      // 加载自定义主题
      const savedCustomTheme = localStorage.getItem('vue-blog-custom-theme')
      if (savedCustomTheme) {
        try {
          this.themePresets.custom = JSON.parse(savedCustomTheme)
        } catch (e) {
          console.error('加载自定义主题失败', e)
        }
      }
    },
    
    // 更新配置
    updateConfig(config) {
      this.$patch(config)
    },
    
    // 切换主题预设
    setThemePreset(presetName) {
      if (this.themePresets[presetName]) {
        this.currentThemePreset = presetName
        this.applyThemePreset(presetName)
        // 保存到本地存储
        localStorage.setItem('vue-blog-theme-preset', presetName)
      }
    },
    
    // 应用主题预设
    applyThemePreset(presetName) {
      const preset = this.themePresets[presetName]
      if (!preset) return
      
      // 应用CSS变量
      const root = document.documentElement
      Object.entries(preset).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value)
      })
    },
    
    // 设置自定义CSS
    setCustomCSS(css) {
      this.customCSS = css
      // 保存到本地存储
      localStorage.setItem('vue-blog-custom-css', css)
    },
    
    // 设置自定义JS
    setCustomJS(js) {
      this.customJS = js
      // 保存到本地存储
      localStorage.setItem('vue-blog-custom-js', js)
    },
    
    // 保存自定义主题
    saveCustomTheme(themeValues) {
      this.themePresets.custom = themeValues
      // 保存到本地存储
      localStorage.setItem('vue-blog-custom-theme', JSON.stringify(themeValues))
    }
  }
}) 