/**
 * 简单的 TOML 解析器
 * 支持基本的 TOML 语法：键值对、表（section）、数组表
 */
export function parseToml(tomlString) {
  const lines = tomlString.split('\n')
  const result = createTomlObject()
  let currentSection = result
  let currentArrayTablePath = []
  let currentArrayItem = null

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index]
    let line = stripInlineComment(rawLine).trim()

    // 跳过空行和注释
    if (!line || line.startsWith('#')) continue

    // 处理数组表 [[section]]
    if (line.startsWith('[[') && line.endsWith(']]')) {
      const sectionName = line.slice(2, -2).trim()
      const keys = sectionName.split('.').map(key => key.trim()).filter(Boolean)

      if (keys.length === 0 || keys.some(isUnsafeTomlKey)) {
        currentSection = null
        continue
      }
      
      let current = result
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = createTomlObject()
        current = current[keys[i]]
      }
      
      const lastKey = keys[keys.length - 1]
      if (!current[lastKey]) current[lastKey] = []
      
      const nextArrayItem = createTomlObject()
      current[lastKey].push(nextArrayItem)
      currentSection = nextArrayItem
      currentArrayTablePath = keys
      currentArrayItem = currentSection
      continue
    }

    // 处理普通表 [section]
    if (line.startsWith('[') && line.endsWith(']')) {
      const sectionName = line.slice(1, -1).trim()
      const keys = sectionName.split('.').map(key => key.trim()).filter(Boolean)

      if (keys.length === 0 || keys.some(isUnsafeTomlKey)) {
        currentSection = null
        continue
      }
      
      const nestedArraySection = resolveNestedArrayTableSection(
        keys,
        currentArrayTablePath,
        currentArrayItem
      )

      if (nestedArraySection) {
        currentSection = nestedArraySection
        continue
      }

      let current = result
      for (const key of keys) {
        if (!current[key]) current[key] = createTomlObject()
        current = current[key]
      }
      
      currentSection = current
      currentArrayTablePath = []
      currentArrayItem = null
      continue
    }

    // 处理键值对
    const equalIndex = rawLine.indexOf('=')
    if (equalIndex > 0) {
      if (!currentSection) {
        continue
      }

      const key = rawLine.slice(0, equalIndex).trim()
      let value = rawLine.slice(equalIndex + 1).trim()

      if (!key || isUnsafeTomlKey(key)) {
        continue
      }

      if (value.startsWith('"""') || value.startsWith("'''")) {
        const delimiter = value.slice(0, 3)
        const parsedMultiline = parseMultilineTomlString(lines, index, value, delimiter)
        value = parsedMultiline.value
        index = parsedMultiline.nextIndex
      } else if (value.startsWith('[') && !isBalancedTomlArray(value)) {
        const parsedArray = parseMultilineTomlArray(lines, index, value)
        value = parseTomlValue(parsedArray.value)
        index = parsedArray.nextIndex
      } else {
        value = parseTomlValue(value)
      }

      currentSection[key] = value
    }
  }

  return result
}

function resolveNestedArrayTableSection(keys, currentArrayTablePath, currentArrayItem) {
  if (
    !currentArrayItem
    || !Array.isArray(currentArrayTablePath)
    || currentArrayTablePath.length === 0
    || keys.length <= currentArrayTablePath.length
  ) {
    return null
  }

  const matchesCurrentArrayPath = currentArrayTablePath.every((key, index) => keys[index] === key)

  if (!matchesCurrentArrayPath) {
    return null
  }

  let current = currentArrayItem
  keys.slice(currentArrayTablePath.length).forEach((key) => {
    if (!current[key]) {
      current[key] = createTomlObject()
    }
    current = current[key]
  })

  return current
}

function stripInlineComment(line) {
  let inString = false
  let escaped = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\' && inString) {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (char === '#' && !inString) {
      return line.slice(0, i)
    }
  }

  return line
}

function parseMultilineTomlString(lines, startIndex, rawValue, delimiter) {
  const openingContent = rawValue.slice(3)
  const inlineClosingIndex = openingContent.indexOf(delimiter)

  if (inlineClosingIndex >= 0) {
    return {
      value: openingContent.slice(0, inlineClosingIndex),
      nextIndex: startIndex
    }
  }

  const collectedLines = [openingContent]
  let nextIndex = startIndex

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const currentLine = lines[index]
    const closingIndex = currentLine.indexOf(delimiter)

    if (closingIndex >= 0) {
      collectedLines.push(currentLine.slice(0, closingIndex))
      nextIndex = index
      break
    }

    collectedLines.push(currentLine)
    nextIndex = index
  }

  return {
    value: collectedLines.join('\n'),
    nextIndex
  }
}

function isBalancedTomlArray(value) {
  const normalizedValue = String(value || '')
  let inString = false
  let escaped = false
  let depth = 0

  for (let index = 0; index < normalizedValue.length; index += 1) {
    const char = normalizedValue[index]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\' && inString) {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === '[') {
      depth += 1
    }

    if (char === ']') {
      depth -= 1
      if (depth <= 0) {
        return true
      }
    }
  }

  return false
}

function parseMultilineTomlArray(lines, startIndex, rawValue) {
  const collectedLines = [stripInlineComment(rawValue)]
  let nextIndex = startIndex

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const currentLine = stripInlineComment(lines[index])
    collectedLines.push(currentLine)
    nextIndex = index

    if (isBalancedTomlArray(collectedLines.join('\n'))) {
      break
    }
  }

  return {
    value: collectedLines.join('\n'),
    nextIndex
  }
}

function splitTomlArrayItems(arrayContent) {
  const items = []
  let current = ''
  let inString = false
  let escaped = false

  for (let index = 0; index < arrayContent.length; index += 1) {
    const char = arrayContent[index]

    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === '\\' && inString) {
      current += char
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      current += char
      continue
    }

    if (char === ',' && !inString) {
      items.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) {
    items.push(current.trim())
  }

  return items
}

function parseTomlArrayItem(value) {
  const normalizedItem = String(value || '').trim()

  if (!normalizedItem) {
    return ''
  }

  if (normalizedItem.startsWith('"') && normalizedItem.endsWith('"')) {
    return normalizedItem.slice(1, -1)
  }

  if (normalizedItem === 'true') {
    return true
  }

  if (normalizedItem === 'false') {
    return false
  }

  if (!Number.isNaN(Number(normalizedItem)) && normalizedItem !== '') {
    return parseFloat(normalizedItem)
  }

  return normalizedItem
}

function parseTomlValue(rawValue) {
  const value = stripInlineComment(String(rawValue || '').trim()).trim()

  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1)
  }

  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  if (!Number.isNaN(Number(value)) && value !== '') {
    return parseFloat(value)
  }

  if (value.startsWith('[') && value.endsWith(']')) {
    const arrayContent = value.slice(1, -1)
    return splitTomlArrayItems(arrayContent)
      .map(parseTomlArrayItem)
      .filter(item => item !== '')
  }

  return value
}

function createTomlObject() {
  return Object.create(null)
}

function isUnsafeTomlKey(key) {
  return ['__proto__', 'prototype', 'constructor'].includes(String(key || '').trim())
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
  for (const key of Object.keys(obj || {})) {
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
