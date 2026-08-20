import { applyConfigEnvOverrides } from './configEnvOverrides.js'

/**
 * 加载所有配置文件
 */
export async function loadAllConfigs() {
  const { default: configs } = await import('../generated/siteConfig.generated.js')

  return applyConfigEnvOverrides(configs, import.meta.env)
}
