import configs from '../generated/siteConfig.generated.js'
import { applyConfigEnvOverrides } from './configEnvOverrides.js'

/**
 * 加载所有配置文件
 */
export function loadAllConfigs() {
  return applyConfigEnvOverrides(configs, import.meta.env)
}
