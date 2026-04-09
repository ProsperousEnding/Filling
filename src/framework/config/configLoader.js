import { applyConfigEnvOverrides } from './configEnvOverrides'
import { parseToml } from '../utils/tomlParser'

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
 * 清除配置缓存
 */
export function clearConfigCache() {
  configCache = {}
}
