/**
 * 配置文件 API 服务
 * 提供读取和写入 TOML 配置文件的功能
 */
import axios from 'axios'

/**
 * 读取配置文件
 * @param {string} fileName - 文件名（例如：'site.toml'）
 * @returns {Promise<string>} 文件内容
 */
export async function readConfigFile(fileName) {
  try {
    const response = await axios.get(`/api/config/read?file=${fileName}`)
    return response.data.content
  } catch (error) {
    console.error(`读取配置文件 ${fileName} 失败:`, error)
    throw error
  }
}

/**
 * 写入配置文件
 * @param {string} fileName - 文件名（例如：'site.toml'）
 * @param {string} content - 文件内容
 * @returns {Promise<object>} 响应结果
 */
export async function writeConfigFile(fileName, content) {
  try {
    console.log(`📤 发送写入请求: ${fileName}`)
    console.log(`📄 文件内容预览:`, content.substring(0, 200))
    
    const response = await axios.post('/api/config/write', {
      fileName,
      content
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`✅ 服务器响应:`, response.data)
    
    return response.data
  } catch (error) {
    console.error(`❌ 写入配置文件 ${fileName} 失败:`, error)
    console.error(`❌ 错误详情:`, error.response?.data || error.message)
    throw error
  }
}

/**
 * 删除配置文件
 * @param {string} fileName - 文件名（例如：'profile.toml'）
 * @returns {Promise<object>} 响应结果
 */
export async function deleteConfigFile(fileName) {
  try {
    const response = await axios.post('/api/config/delete', { fileName }, {
      headers: { 'Content-Type': 'application/json' }
    })
    return response.data
  } catch (error) {
    console.error(`❌ 删除配置文件 ${fileName} 失败:`, error)
    throw error
  }
}

/**
 * 列出所有配置文件
 * @returns {Promise<string[]>} 文件列表
 */
export async function listConfigFiles() {
  try {
    const response = await axios.get('/api/config/list')
    return response.data.files
  } catch (error) {
    console.error('列出配置文件失败:', error)
    throw error
  }
}

// ===== 专用 Profile 接口 =====
export async function readProfileToml() {
  const response = await axios.get('/api/profile/read')
  return response.data.content
}

export async function writeProfileToml(content) {
  const response = await axios.post('/api/profile/write', { content }, { headers: { 'Content-Type': 'application/json' } })
  return response.data
}

export async function deleteProfileToml() {
  const response = await axios.post('/api/profile/delete', {}, { headers: { 'Content-Type': 'application/json' } })
  return response.data
}

export async function restoreDefaultProfileToml() {
  const response = await axios.post('/api/profile/restore-default', {}, { headers: { 'Content-Type': 'application/json' } })
  return response.data
}

export default {
  readConfigFile,
  writeConfigFile,
  listConfigFiles,
  deleteConfigFile,
  readProfileToml,
  writeProfileToml,
  deleteProfileToml,
  restoreDefaultProfileToml
}
