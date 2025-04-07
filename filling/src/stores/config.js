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
    enableComments: true
  }),
  
  actions: {
    // 初始化配置
    initConfig(config = {}) {
      this.$patch(config)
    },
    
    // 切换主题
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
    
    // 从本地存储加载主题
    loadThemeFromStorage() {
      const savedTheme = localStorage.getItem('vue-blog-theme')
      if (savedTheme) {
        this.theme = savedTheme
        document.documentElement.classList.toggle('dark', this.theme === 'dark')
      }
    },
    
    // 更新配置
    updateConfig(config) {
      this.$patch(config)
    }
  }
}) 