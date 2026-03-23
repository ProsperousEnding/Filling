import { defineStore } from 'pinia'
import configLoader, { onConfigUpdate, clearConfigCache } from '../services/configLoader'
import { writeConfigFile, readConfigFile, deleteConfigFile, writeProfileToml, restoreDefaultProfileToml } from '../api/configApi'
import { stringifyToml } from '../utils/tomlParser'

// 获取最新的 TOML 配置（函数形式，每次调用都重新获取）
async function getLatestConfigs() {
  // 清除缓存，强制重新读取文件
  clearConfigCache()
  
  // 直接加载所有配置，避免通过 getter 导致的并发问题
  const allConfigs = await configLoader.loadAllConfigs()
  
  console.log('🔍 getLatestConfigs 加载结果:', {
    site: allConfigs.site ? '✅' : '❌',
    profile: allConfigs.profile ? '✅' : '❌',
    theme: allConfigs.theme ? '✅' : '❌',
    siteTitle: allConfigs.site?.title,
    profileName: allConfigs.profile?.display_name
  })
  
  return { 
    site: allConfigs.site || {}, 
    profile: allConfigs.profile || {}, 
    theme: allConfigs.theme || {} 
  }
}

// 首次加载配置（同步初始化，使用空对象作为默认值）
let siteConfig = {}
let profileConfig = {}
let themeConfig = {}

// 异步加载初始配置
getLatestConfigs().then(configs => {
  siteConfig = configs.site
  profileConfig = configs.profile
  themeConfig = configs.theme
  console.log('🚀 初始配置已加载')
})

// 转换下划线命名为驼峰命名
function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item))
  }
  
  const result = {}
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = toCamelCase(obj[key])
  }
  return result
}

// 转换主题配置格式
function convertThemePresets(presets) {
  if (!presets) return {}
  
  const converted = {}
  for (const [name, preset] of Object.entries(presets)) {
    converted[name] = toCamelCase(preset)
  }
  return converted
}

export const useConfigStore = defineStore('config', {
  state: () => ({
    theme: 'light',
    sidebarVisible: siteConfig.features?.sidebar_visible,
    sidebarPosition: siteConfig.features?.sidebar_position || 'right',
    apiBaseUrl: '/api',
    pageSize: siteConfig.pagination?.page_size,
    blogTitle: siteConfig.title,
    blogDescription: siteConfig.description,
    footerText: siteConfig.footer_text,
    showCategoryCount: siteConfig.features?.show_category_count,
    showTagCount: siteConfig.features?.show_tag_count,
    showReadTime: siteConfig.features?.show_read_time,
    enableComments: siteConfig.features?.enable_comments,
    showProfileInSidebar: (siteConfig.features?.show_profile_in_sidebar ?? true),
    umamiEnabled: (siteConfig.analytics?.umami?.enabled ?? false),
    umamiScriptUrl: siteConfig.analytics?.umami?.script_url || '',
    umamiWebsiteId: siteConfig.analytics?.umami?.website_id || '',
    umamiHostUrl: siteConfig.analytics?.umami?.host_url || '',
    userProfile: {
      displayName: profileConfig.display_name,
      username: profileConfig.username,
      tagline: profileConfig.tagline,
      bio: profileConfig.bio,
      avatarUrl: profileConfig.avatar_url,
      location: profileConfig.location,
      website: profileConfig.website,
      socialLinks: Array.isArray(profileConfig.social_links) 
        ? profileConfig.social_links.map(link => toCamelCase(link))
        : []
    },
    personalLogs: [],
    articleDrafts: [],
    // 自定义CSS - 直接从 TOML 配置文件读取
    customCSS: themeConfig.custom_css,
    // 当前使用的预设主题 - 直接从 TOML 配置文件读取
    currentThemePreset: themeConfig.current_preset,
    // 主题预设配置 - 直接从 TOML 文件加载
    themePresets: convertThemePresets(themeConfig.presets),
    // 自定义JS - 直接从 TOML 配置文件读取
    customJS: themeConfig.custom_js
  }),
  
  getters: {
    // 向后兼容：提供 avatarUrl 访问器
    avatarUrl: (state) => state.userProfile?.avatarUrl || ''
  },
  
  actions: {
    // 初始化配置
    initConfig(config = {}) {
      this.$patch(config)
      // 初始化时应用当前主题预设
      this.applyThemePreset(this.currentThemePreset)
    },
    
    // 设置配置文件监听器 - 实现响应式热更新
    setupConfigWatcher() {
      // 防抖定时器
      let reloadTimeout = null
      
      // 注册配置更新回调
      const unwatch = onConfigUpdate(() => {
        console.log('📝 检测到配置文件更新')
        // 使用防抖避免重复触发
        if (reloadTimeout) clearTimeout(reloadTimeout)
        reloadTimeout = setTimeout(() => {
          this.reloadConfigFromToml()
        }, 200)
      })
      
      // 监听通用配置更新事件
      const handleConfigUpdate = (event) => {
        console.log('📡 收到配置更新事件')
        // 使用防抖避免重复触发
        if (reloadTimeout) clearTimeout(reloadTimeout)
        reloadTimeout = setTimeout(() => {
          this.reloadConfigFromToml()
        }, 200)
      }
      
      window.addEventListener('config-updated', handleConfigUpdate)
      
      // 保存取消监听函数
      this._unwatchConfig = unwatch
      this._unwatchConfigEvent = () => {
        window.removeEventListener('config-updated', handleConfigUpdate)
      }
    },
    
    // 取消配置监听
    teardownConfigWatcher() {
      if (this._unwatchConfig) {
        this._unwatchConfig()
        this._unwatchConfig = null
      }
      if (this._unwatchConfigEvent) {
        this._unwatchConfigEvent()
        this._unwatchConfigEvent = null
      }
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
    
    // 清理旧的 localStorage 配置数据（迁移到 TOML）
    cleanupLegacyStorage() {
      // 清理旧的配置数据，这些现在都从 TOML 文件加载
      const legacyKeys = [
        'vue-blog-user-profile',
        'vue-blog-theme-preset',
        'vue-blog-custom-css',
        'vue-blog-custom-js',
        'vue-blog-custom-theme'
      ]
      
      legacyKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key)
          console.log(`🧹 已清理旧配置: ${key}`)
        }
      })
    },
    
    // 从本地存储加载主题设置
    loadThemeFromStorage() {
      // 清理旧的 localStorage 配置数据
      this.cleanupLegacyStorage()
      
      // 只加载明暗主题设置（不影响其他配置）
      const savedTheme = localStorage.getItem('vue-blog-theme')
      if (savedTheme) {
        this.theme = savedTheme
        document.documentElement.classList.toggle('dark', this.theme === 'dark')
      }
      
      // 注意：其他配置（用户资料、主题预设等）都从 TOML 文件加载
      // localStorage 不再覆盖 TOML 配置，确保 TOML 是唯一数据源
      
      // 加载个人日志（这些不在 TOML 中，保留在 localStorage）
      const savedLogs = localStorage.getItem('vue-blog-personal-logs')
      if (savedLogs) {
        try {
          const parsedLogs = JSON.parse(savedLogs)
          this.personalLogs = Array.isArray(parsedLogs) ? parsedLogs : []
        } catch (e) {
          console.error('加载个人日志失败', e)
        }
      }

      // 加载文章草稿（这些不在 TOML 中，保留在 localStorage）
      const savedDrafts = localStorage.getItem('vue-blog-article-drafts')
      if (savedDrafts) {
        try {
          const parsedDrafts = JSON.parse(savedDrafts)
          this.articleDrafts = Array.isArray(parsedDrafts) ? parsedDrafts : []
        } catch (e) {
          console.error('加载文章草稿失败', e)
        }
      }
      
      console.log('📖 配置已从 TOML 文件加载，localStorage 仅保留明暗主题、日志和草稿')
    },
    
    // 更新配置
    updateConfig(config) {
      this.$patch(config)
    },
    
    // 切换主题预设 - 直接保存到 TOML 文件
    async setThemePreset(presetName) {
      if (this.themePresets[presetName]) {
        this.currentThemePreset = presetName
        this.applyThemePreset(presetName)
        // 保存到 TOML 文件（唯一数据源）
        await this.saveThemeToToml()
        console.log(`✅ 主题已切换为 ${presetName} 并保存到 theme.toml`)
      }
    },

    // 更新用户资料 - 直接保存到 TOML 文件
    async updateUserProfile(profile = {}) {
      // 先更新 store 状态（立即反馈给 UI）
      this.userProfile = {
        ...this.userProfile,
        ...profile
      }
      
      // 强制触发 Vue 响应式更新
      this.$patch({
        userProfile: { ...this.userProfile }
      })
      
      // 保存到 profile.toml（专用接口）
      await this.saveProfileToToml()
      
      console.log('✅ 用户资料已更新并保存到 profile.toml')
      
      // 注意：不需要手动调用 reloadConfigFromToml()
      // HMR 会自动检测文件变化并触发重新加载
    },
    
    // 保存用户资料到 TOML 文件
    async saveProfileToToml() {
      try {
        const profileData = {
          display_name: this.userProfile.displayName,
          username: this.userProfile.username,
          tagline: this.userProfile.tagline,
          bio: this.userProfile.bio,
          avatar_url: this.userProfile.avatarUrl,
          location: this.userProfile.location,
          website: this.userProfile.website,
          social_links: this.userProfile.socialLinks.map(link => ({
            label: link.label,
            url: link.url,
            icon: link.icon
          }))
        }
        
        console.log('📝 准备保存的数据:', profileData)
        
        const tomlContent = '# 个人信息配置\n' + stringifyToml(profileData)
        console.log('📄 TOML 内容:', tomlContent)
        
        const result = await writeProfileToml(tomlContent)
        
        console.log('✅ 配置已保存到 profile.toml 文件，服务器响应:', result)
      } catch (error) {
        console.error('❌ 保存配置文件失败:', error)
        throw error
      }
    },
    
    // 导出当前配置为 TOML 格式
    exportConfigAsToml() {
      // 将当前配置转换为 TOML 格式的对象
      const tomlConfig = {
        profile: {
          display_name: this.userProfile.displayName,
          username: this.userProfile.username,
          tagline: this.userProfile.tagline,
          bio: this.userProfile.bio,
          avatar_url: this.userProfile.avatarUrl,
          location: this.userProfile.location,
          website: this.userProfile.website,
          social_links: this.userProfile.socialLinks.map(link => ({
            label: link.label,
            url: link.url,
            icon: link.icon
          }))
        },
        site: {
          title: this.blogTitle,
          description: this.blogDescription,
          footer_text: this.footerText,
          features: {
            show_category_count: this.showCategoryCount,
            show_tag_count: this.showTagCount,
            show_read_time: this.showReadTime,
            enable_comments: this.enableComments,
            sidebar_visible: this.sidebarVisible,
            sidebar_position: this.sidebarPosition,
            show_profile_in_sidebar: this.showProfileInSidebar
          },
          pagination: {
            page_size: this.pageSize
          },
          analytics: {
            umami: {
              enabled: this.umamiEnabled,
              script_url: this.umamiScriptUrl || '',
              website_id: this.umamiWebsiteId || '',
              host_url: this.umamiHostUrl || ''
            }
          }
        },
        theme: {
          current_preset: this.currentThemePreset,
          custom_css: this.customCSS,
          custom_js: this.customJS,
          presets: this.themePresets
        }
      }
      
      return tomlConfig
    },

    // 添加个人日志（保留 localStorage，因为这些不在 TOML 中）
    addPersonalLog(logEntry = {}) {
      const now = new Date().toISOString()
      const logId = logEntry.id || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString())
      const log = {
        id: logId,
        title: logEntry.title || '未命名日志',
        content: logEntry.content || '',
        mood: logEntry.mood || 'daily',
        createdAt: logEntry.createdAt || now,
        updatedAt: now,
        tags: Array.isArray(logEntry.tags) ? logEntry.tags : []
      }
      this.personalLogs = [log, ...this.personalLogs.filter(item => item.id !== logId)]
      localStorage.setItem('vue-blog-personal-logs', JSON.stringify(this.personalLogs))
      return log
    },

    // 删除个人日志
    deletePersonalLog(logId) {
      this.personalLogs = this.personalLogs.filter(log => log.id !== logId)
      localStorage.setItem('vue-blog-personal-logs', JSON.stringify(this.personalLogs))
    },

    // 更新个人日志
    updatePersonalLog(logId, updates = {}) {
      const existing = this.personalLogs.find(log => log.id === logId)
      if (!existing) return null
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      }
      this.personalLogs = [updated, ...this.personalLogs.filter(log => log.id !== logId)]
      localStorage.setItem('vue-blog-personal-logs', JSON.stringify(this.personalLogs))
      return updated
    },

    // 保存或更新文章草稿（保留 localStorage，因为这些不在 TOML 中）
    saveArticleDraft(draft = {}) {
      const now = new Date().toISOString()
      if (!draft.id) {
        draft.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
        draft.createdAt = now
      }
      const normalizedDraft = {
        id: draft.id,
        title: draft.title || '未命名草稿',
        content: draft.content || '',
        summary: draft.summary || '',
        cover: draft.cover || '',
        tags: Array.isArray(draft.tags) ? draft.tags : [],
        category: draft.category || '',
        createdAt: draft.createdAt || now,
        updatedAt: now,
        status: draft.status || 'draft'
      }
      this.articleDrafts = [
        normalizedDraft,
        ...this.articleDrafts.filter(item => item.id !== normalizedDraft.id)
      ]
      localStorage.setItem('vue-blog-article-drafts', JSON.stringify(this.articleDrafts))
      return normalizedDraft
    },

    // 删除文章草稿
    deleteArticleDraft(draftId) {
      this.articleDrafts = this.articleDrafts.filter(draft => draft.id !== draftId)
      localStorage.setItem('vue-blog-article-drafts', JSON.stringify(this.articleDrafts))
    },

    // 获取草稿
    getArticleDraft(draftId) {
      return this.articleDrafts.find(draft => draft.id === draftId) || null
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
    
    // 设置自定义CSS - 直接保存到 TOML 文件
    async setCustomCSS(css) {
      this.customCSS = css
      // 保存到 TOML 文件（唯一数据源）
      await this.saveThemeToToml()
      console.log('✅ 自定义 CSS 已保存到 theme.toml')
    },
    
    // 设置自定义JS - 直接保存到 TOML 文件
    async setCustomJS(js) {
      this.customJS = js
      // 保存到 TOML 文件（唯一数据源）
      await this.saveThemeToToml()
      console.log('✅ 自定义 JS 已保存到 theme.toml')
    },
    
    // 保存自定义主题 - 直接保存到 TOML 文件
    async saveCustomTheme(themeValues) {
      this.themePresets.custom = themeValues
      // 保存到 TOML 文件（唯一数据源）
      await this.saveThemeToToml()
      console.log('✅ 自定义主题已保存到 theme.toml')
    },
    
    // 保存主题配置到 TOML 文件
    async saveThemeToToml() {
      try {
        const themeData = {
          current_preset: this.currentThemePreset,
          custom_css: this.customCSS || '',
          custom_js: this.customJS || '',
          presets: {}
        }
        
        // 转换主题预设（驼峰转下划线）
        Object.entries(this.themePresets).forEach(([name, preset]) => {
          if (preset && name !== 'custom') {
            themeData.presets[name] = {}
            Object.entries(preset).forEach(([key, value]) => {
              const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
              themeData.presets[name][snakeKey] = value
            })
          }
        })
        
        const tomlContent = '# 主题配置文件\n' + stringifyToml(themeData)
        await writeConfigFile('theme.toml', tomlContent)
        
        console.log('✅ 主题配置已保存到 theme.toml 文件')
      } catch (error) {
        console.error('❌ 保存主题配置失败:', error)
        throw error
      }
    },
    
    // 保存网站配置到 TOML 文件
    async saveSiteToToml() {
      try {
        const siteData = {
          title: this.blogTitle,
          description: this.blogDescription,
          footer_text: this.footerText,
          features: {
            show_category_count: this.showCategoryCount,
            show_tag_count: this.showTagCount,
            show_read_time: this.showReadTime,
            enable_comments: this.enableComments,
            sidebar_visible: this.sidebarVisible,
            sidebar_position: this.sidebarPosition,
            show_profile_in_sidebar: this.showProfileInSidebar
          },
          pagination: {
            page_size: this.pageSize
          },
          analytics: {
            umami: {
              enabled: this.umamiEnabled,
              script_url: this.umamiScriptUrl || '',
              website_id: this.umamiWebsiteId || '',
              host_url: this.umamiHostUrl || ''
            }
          }
        }
        
        const tomlContent = '# 网站基础配置\n' + stringifyToml(siteData)
        await writeConfigFile('site.toml', tomlContent)
        
        console.log('✅ 网站配置已保存到 site.toml 文件')
      } catch (error) {
        console.error('❌ 保存网站配置失败:', error)
        throw error
      }
    },

    // 重置用户个性化数据 - 专用接口恢复默认 profile.toml
    async resetPersonalization() {
      try {
        await restoreDefaultProfileToml()
        await this.reloadConfigFromToml()
        console.log('✅ 已恢复默认 profile.toml')
      } catch (error) {
        console.error('❌ 重置个性化失败:', error)
        throw error
      }
    },

    // 从 TOML 配置文件重新加载配置
    async reloadConfigFromToml() {
      console.log('🔄 开始重新加载TOML配置...')
      // 并发保护：为每次加载生成序号，丢弃过期结果
      const currentSeq = (this._reloadSeq = (this._reloadSeq || 0) + 1)
      
      // 强制重新读取配置文件
      const latest = await getLatestConfigs()
      // 如果在等待期间又有新一轮加载启动，则丢弃本次结果
      if (currentSeq !== this._reloadSeq) {
        console.log('⏭️ 丢弃过期的配置加载结果')
        return
      }
      
      // 宽松的配置验证 - 只要配置对象存在即可
      if (!latest.site && !latest.profile && !latest.theme) {
        console.warn('⚠️ 所有配置都为空，跳过本次更新')
        return
      }
      
      // 更新配置（即使某些配置不完整也继续）
      if (latest.site) {
        siteConfig = latest.site
      }
      if (latest.profile) {
        profileConfig = latest.profile
      }
      if (latest.theme) {
        themeConfig = latest.theme
      }
      
      console.log('📖 最新配置数据:', { 
        profile: profileConfig?.display_name,
        site: siteConfig?.title,
        theme: themeConfig?.current_preset
      })
      
      // 更新网站配置 - 直接使用 TOML 配置文件的值
      if (siteConfig && siteConfig.title) {
        this.blogTitle = siteConfig.title
        this.blogDescription = siteConfig.description
        this.footerText = siteConfig.footer_text
        this.sidebarVisible = siteConfig.features?.sidebar_visible
        this.sidebarPosition = siteConfig.features?.sidebar_position || 'right'
        this.pageSize = siteConfig.pagination?.page_size
        this.showCategoryCount = siteConfig.features?.show_category_count
        this.showTagCount = siteConfig.features?.show_tag_count
        this.showReadTime = siteConfig.features?.show_read_time
        this.enableComments = siteConfig.features?.enable_comments
        this.showProfileInSidebar = (siteConfig.features?.show_profile_in_sidebar ?? true)
        this.umamiEnabled = (siteConfig.analytics?.umami?.enabled ?? false)
        this.umamiScriptUrl = siteConfig.analytics?.umami?.script_url || ''
        this.umamiWebsiteId = siteConfig.analytics?.umami?.website_id || ''
        this.umamiHostUrl = siteConfig.analytics?.umami?.host_url || ''
      }
      
      // 更新个人信息配置 - 直接使用 TOML 配置文件的值
      if (profileConfig) {
        this.userProfile = {
          displayName: profileConfig.display_name,
          username: profileConfig.username,
          tagline: profileConfig.tagline,
          bio: profileConfig.bio,
          avatarUrl: profileConfig.avatar_url,
          location: profileConfig.location,
          website: profileConfig.website,
          socialLinks: Array.isArray(profileConfig.social_links) 
            ? profileConfig.social_links.map(link => toCamelCase(link))
            : []
        }
        
        // 强制触发Vue响应式更新
        this.$patch({
          userProfile: { ...this.userProfile }
        })
        
        console.log('✅ 个人信息配置已更新:', this.userProfile)
      }
      
      // 更新主题配置 - 直接使用 TOML 配置文件的值
      if (themeConfig) {
        this.customCSS = themeConfig.custom_css
        this.customJS = themeConfig.custom_js
        this.currentThemePreset = themeConfig.current_preset
        this.themePresets = convertThemePresets(themeConfig.presets)
        
        // 应用新的主题
        this.applyThemePreset(this.currentThemePreset)
      }
    }
  }
}) 