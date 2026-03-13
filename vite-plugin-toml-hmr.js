/**
 * Vite 插件：TOML 配置文件热更新
 * 监听 TOML 文件变化并触发 HMR
 */
import path from "path"

export default function tomlHmrPlugin() {
  return {
    name: "vite-plugin-toml-hmr",
    
    // 处理 TOML 文件变化
    handleHotUpdate({ file, server }) {
      // 标准化文件路径
      const normalizedFile = path.normalize(file).replace(/\\/g, "/")
      
      // 检查是否是 TOML 配置文件
      if (normalizedFile.includes("/src/config/") && normalizedFile.endsWith(".toml")) {
        console.log(` 检测到配置文件变化: ${normalizedFile}`)
        
        // 发送自定义 HMR 事件以触发客户端更新
        server.ws.send({
          type: "custom",
          event: "toml-config-updated",
          data: {
            file: normalizedFile,
            timestamp: Date.now()
          }
        })
        
        // 查找并更新所有相关模块
        const modulesToUpdate = []
        const modulePatterns = [
          "configLoader",
          "config.js",
          "App.vue",
          "Sidebar.vue",
          "ProfileSettings.vue",
          "ThemeSettings.vue",
          "BlogContainer.vue",
          "Header.vue",
          "Footer.vue"
        ]
        
        // 遍历所有模块
        for (const [id, mod] of server.moduleGraph.idToModuleMap) {
          const normalizedId = id.replace(/\\/g, "/")
          
          // 检查是否匹配任何模式
          const shouldUpdate = modulePatterns.some(pattern => normalizedId.includes(pattern))
          
          if (shouldUpdate) {
            modulesToUpdate.push(mod)
            server.moduleGraph.invalidateModule(mod)
            console.log(`   失效模块: ${normalizedId}`)
          }
        }
        
        // 同时失效与该 TOML 文件直接相关的模块（包括 ?raw 导入）
        const fileModules = server.moduleGraph.getModulesByFile(normalizedFile)
        if (fileModules) {
          fileModules.forEach(mod => {
            modulesToUpdate.push(mod)
            server.moduleGraph.invalidateModule(mod)
            console.log(`   失效 TOML 直接相关模块: ${mod.id?.replace(/\\\\/g, '/')}`)
          })
        }

        // 统一处理所有TOML配置文件变化
        console.log(`   处理 ${normalizedFile} 配置文件变化...`)
        
        // 如果没有找到模块，尝试另一种方法
        if (modulesToUpdate.length === 0) {
          console.log("   没有找到模块，尝试通过文件路径查找...")
          
          // 通过文件路径查找模块
          const filesToInvalidate = [
            "/src/services/configLoader.js",
            "/src/stores/config.js",
            "/src/App.vue",
            "/src/components/layout/Sidebar.vue",
            "/src/views/settings/ProfileSettings.vue",
            "/src/views/ThemeSettings.vue"
          ]
          
          for (const filePath of filesToInvalidate) {
            const fullPath = path.join(server.config.root, filePath).replace(/\\/g, "/")
            const mods = server.moduleGraph.getModulesByFile(fullPath)
            if (mods) {
              mods.forEach(mod => {
                if (mod) {
                  modulesToUpdate.push(mod)
                  server.moduleGraph.invalidateModule(mod)
                  console.log(`   通过文件路径失效模块: ${filePath}`)
                }
              })
            }
          }
        }
        
        console.log(` 触发配置热更新 (${modulesToUpdate.length} 个模块)`)
        
        // 返回需要更新的模块
        return modulesToUpdate.length > 0 ? modulesToUpdate : []
      }
      
      return []
    }
  }
}
