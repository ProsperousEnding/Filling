import { parseToml } from '../utils/tomlParser'

// 动态导入所有配置文件（支持热更新）
const configFiles = import.meta.glob('@/config/*.toml', { 
  eager: false,  // 改为非eager模式，支持动态重新加载
  query: '?raw',
  import: 'default'
})

// 配置缓存
let configCache = {}

/**
 * 加载所有配置文件
 */
export async function loadAllConfigs() {
  const configs = {}
  
  for (const path in configFiles) {
    const fileName = path.split('/').pop().replace('.toml', '')
    
    try {
      // 强制绕过模块缓存：使用带时间戳的 ?raw 动态导入
      // 说明：有些情况下仅失效模块不足以让 import.meta.glob 返回最新字符串
      // 这里直接用带时间戳的动态 import，确保每次都从磁盘读取最新内容
      const mod = await import(/* @vite-ignore */ `${path}?raw&t=${Date.now()}`)
      const content = mod.default
      configs[fileName] = parseToml(content)
    } catch (error) {
      console.error(`❌ 解析配置文件 ${fileName}.toml 失败:`, error)
      configs[fileName] = {}
    }
  }
  
  configCache = configs
  console.log('📦 配置已加载:', Object.keys(configs).join(', '))
  return configs
}

/**
 * 获取网站配置
 */
export async function getSiteConfig() {
  if (!configCache.site) {
    await loadAllConfigs()
  }
  return configCache.site || {}
}

/**
 * 获取个人信息配置
 */
export async function getProfileConfig() {
  if (!configCache.profile) {
    await loadAllConfigs()
  }
  return configCache.profile || {}
}

/**
 * 获取主题配置
 */
export async function getThemeConfig() {
  if (!configCache.theme) {
    await loadAllConfigs()
  }
  return configCache.theme || {}
}

/**
 * 清除配置缓存
 */
export function clearConfigCache() {
  configCache = {}
}

/**
 * 注册配置更新回调
 */
export function onConfigUpdate(callback) {
  if (!window.__CONFIG_UPDATE_CALLBACKS__) {
    window.__CONFIG_UPDATE_CALLBACKS__ = []
  }
  window.__CONFIG_UPDATE_CALLBACKS__.push(callback)
  
  // 返回取消注册函数
  return () => {
    const index = window.__CONFIG_UPDATE_CALLBACKS__.indexOf(callback)
    if (index > -1) {
      window.__CONFIG_UPDATE_CALLBACKS__.splice(index, 1)
    }
  }
}

// Vite HMR 支持 - 监听配置文件变化
if (import.meta.hot) {
  // 监听模块自身更新
  import.meta.hot.accept(() => {
    console.log(' 配置加载器模块已更新')
    clearConfigCache()
    loadAllConfigs().then(() => {
      // 通知所有订阅者配置已更新
      if (window.__CONFIG_UPDATE_CALLBACKS__) {
        window.__CONFIG_UPDATE_CALLBACKS__.forEach(callback => {
          try {
            callback(configCache)
          } catch (error) {
            console.error('配置更新回调执行失败:', error)
          }
        })
      }
    })
  })
  
  // 监听自定义 TOML 配置更新事件（使用防抖避免重复触发）
  let tomlUpdateTimeout = null
  import.meta.hot.on('toml-config-updated', (data) => {
    console.log('🔔 收到 TOML 配置更新事件:', data.file)
    
    // 清除之前的定时器
    if (tomlUpdateTimeout) {
      clearTimeout(tomlUpdateTimeout)
    }
    
    // 设置新的防抖定时器（300ms）
    tomlUpdateTimeout = setTimeout(() => {
      clearConfigCache()
      loadAllConfigs().then(() => {
        // 通知所有订阅者配置已更新
        if (window.__CONFIG_UPDATE_CALLBACKS__) {
          window.__CONFIG_UPDATE_CALLBACKS__.forEach(callback => {
            try {
              callback(configCache)
            } catch (error) {
              console.error('配置更新回调执行失败:', error)
            }
          })
        }
        
        // 发送通用配置更新事件
        window.dispatchEvent(new CustomEvent('config-updated', {
          detail: { 
            file: data.file,
            config: configCache 
          }
        }))
        
        console.log('✅ 配置更新完成')
      })
    }, 300)
  })
}

/**
 * 配置服务
 */
export default {
  loadAllConfigs,
  getSiteConfig,
  getProfileConfig,
  getThemeConfig,
  clearConfigCache,
  onConfigUpdate
}
