import { applyConfigEnvOverrides } from './configEnvOverrides.js'
import { parseToml } from '../utils/tomlParser.js'

// 动态导入所有配置文件
const configFiles = import.meta.glob('/blog/config/*.toml', {
  eager: false,
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
      // 统一走 import.meta.glob 生成的 loader，确保 Vite 将 TOML 作为 raw 字符串模块处理。
      // 在 Vite 7 下，手写的动态 import(`${path}?raw&t=...`) 会直接请求 TOML 资源并触发 MIME 错误。
      const content = await configFiles[path]()
      configs[fileName] = parseToml(content)
    } catch (error) {
      console.error(`❌ 解析配置文件 ${fileName}.toml 失败:`, error)
      configs[fileName] = {}
    }
  }
  
  const resolvedConfigs = applyConfigEnvOverrides(configs, import.meta.env)

  configCache = resolvedConfigs
  console.log('📦 配置已加载:', Object.keys(resolvedConfigs).join(', '))
  return resolvedConfigs
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
 * 获取公告配置
 */
export async function getAnnouncementConfig() {
  if (!configCache.announcement) {
    await loadAllConfigs()
  }
  return configCache.announcement || {}
}

/**
 * 获取评论配置
 */
export async function getCommentConfig() {
  if (!configCache.comment) {
    await loadAllConfigs()
  }
  return configCache.comment || {}
}

/**
 * 获取赞助配置
 */
export async function getSponsorConfig() {
  if (!configCache.sponsor) {
    await loadAllConfigs()
  }
  return configCache.sponsor || {}
}

/**
 * 获取许可协议配置
 */
export async function getLicenseConfig() {
  if (!configCache.license) {
    await loadAllConfigs()
  }
  return configCache.license || {}
}

/**
 * 获取统计分析配置
 */
export async function getAnalyticsConfig() {
  if (!configCache.analytics) {
    await loadAllConfigs()
  }
  return configCache.analytics || {}
}

/**
 * 获取字体配置
 */
export async function getFontConfig() {
  if (!configCache.font) {
    await loadAllConfigs()
  }
  return configCache.font || {}
}

/**
 * 获取代码块配置
 */
export async function getCodeBlockConfig() {
  if (!configCache.code_block) {
    await loadAllConfigs()
  }
  return configCache.code_block || {}
}

/**
 * 获取 Markdown 增强配置
 */
export async function getMarkdownConfig() {
  if (!configCache.markdown) {
    await loadAllConfigs()
  }
  return configCache.markdown || {}
}

/**
 * 获取背景配置
 */
export async function getBackgroundConfig() {
  if (!configCache.background) {
    await loadAllConfigs()
  }
  return configCache.background || {}
}

/**
 * 获取封面图配置
 */
export async function getCoverConfig() {
  if (!configCache.cover) {
    await loadAllConfigs()
  }
  return configCache.cover || {}
}

/**
 * 获取留言板配置
 */
export async function getGuestbookConfig() {
  if (!configCache.guestbook) {
    await loadAllConfigs()
  }
  return configCache.guestbook || {}
}

/**
 * 清除配置缓存
 */
export function clearConfigCache() {
  configCache = {}
}
