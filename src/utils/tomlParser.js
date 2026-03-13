/**
 * 简单的 TOML 解析器
 * 支持基本的 TOML 语法：键值对、表（section）、数组表
 */
export function parseToml(tomlString) {
  const lines = tomlString.split('\n')
  const result = {}
  let currentSection = result
  let currentArray = null
  let currentArrayKey = null

  for (let line of lines) {
    line = line.trim()

    // 跳过空行和注释
    if (!line || line.startsWith('#')) continue

    // 处理数组表 [[section]]
    if (line.startsWith('[[') && line.endsWith(']]')) {
      const sectionName = line.slice(2, -2).trim()
      const keys = sectionName.split('.')
      
      let current = result
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}
        current = current[keys[i]]
      }
      
      const lastKey = keys[keys.length - 1]
      if (!current[lastKey]) current[lastKey] = []
      
      currentArray = {}
      current[lastKey].push(currentArray)
      currentSection = currentArray
      currentArrayKey = lastKey
      continue
    }

    // 处理普通表 [section]
    if (line.startsWith('[') && line.endsWith(']')) {
      const sectionName = line.slice(1, -1).trim()
      const keys = sectionName.split('.')
      
      let current = result
      for (const key of keys) {
        if (!current[key]) current[key] = {}
        current = current[key]
      }
      
      currentSection = current
      currentArray = null
      continue
    }

    // 处理键值对
    const equalIndex = line.indexOf('=')
    if (equalIndex > 0) {
      const key = line.slice(0, equalIndex).trim()
      let value = line.slice(equalIndex + 1).trim()

      // 解析值
      if (value.startsWith('"') && value.endsWith('"')) {
        // 字符串值
        value = value.slice(1, -1)
      } else if (value === 'true') {
        value = true
      } else if (value === 'false') {
        value = false
      } else if (!isNaN(value)) {
        // 数字值
        value = parseFloat(value)
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // 数组值
        const arrayContent = value.slice(1, -1)
        value = arrayContent.split(',').map(item => {
          item = item.trim()
          if (item.startsWith('"') && item.endsWith('"')) {
            return item.slice(1, -1)
          }
          return item
        }).filter(item => item)
      }

      currentSection[key] = value
    }
  }

  return result
}

/**
 * 将对象转换为 TOML 字符串
 */
export function stringifyToml(obj, parentKey = '') {
  let result = ''
  const simpleKeys = []
  const tableKeys = []
  const arrayTableKeys = []

  // 分类键
  for (const key in obj) {
    const value = obj[key]
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      arrayTableKeys.push(key)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      tableKeys.push(key)
    } else {
      simpleKeys.push(key)
    }
  }

  // 先输出简单键值对
  for (const key of simpleKeys) {
    const value = obj[key]
    if (typeof value === 'string') {
      result += `${key} = "${value}"\n`
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      result += `${key} = ${value}\n`
    } else if (Array.isArray(value)) {
      const arrayStr = value.map(v => typeof v === 'string' ? `"${v}"` : v).join(', ')
      result += `${key} = [${arrayStr}]\n`
    }
  }

  // 输出表
  for (const key of tableKeys) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key
    result += `\n[${fullKey}]\n`
    result += stringifyToml(obj[key], fullKey)
  }

  // 输出数组表
  for (const key of arrayTableKeys) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key
    for (const item of obj[key]) {
      result += `\n[[${fullKey}]]\n`
      result += stringifyToml(item, fullKey)
    }
  }

  return result
}
