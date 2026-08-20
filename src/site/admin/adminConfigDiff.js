function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function appendPath(path, key, arrayIndex = false) {
  if (arrayIndex) return `${path}[${key}]`
  return path ? `${path}.${key}` : String(key)
}

function collectDiff(before, after, path, changes) {
  if (Object.is(before, after)) return

  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length)
    for (let index = 0; index < length; index += 1) {
      collectDiff(before[index], after[index], appendPath(path, index, true), changes)
    }
    return
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    keys.forEach((key) => {
      collectDiff(before[key], after[key], appendPath(path, key), changes)
    })
    return
  }

  changes.push({
    path: path || '配置',
    before,
    after,
    kind: before === undefined ? 'added' : after === undefined ? 'removed' : 'changed'
  })
}

export function createAdminConfigDiff(before = {}, after = {}) {
  const changes = []
  collectDiff(before, after, '', changes)
  return changes
}

export function formatAdminDiffValue(value, maxLength = 80) {
  if (value === undefined) return '未设置'
  if (value === '') return '空值'
  if (typeof value === 'boolean') return value ? '开启' : '关闭'

  const text = typeof value === 'string'
    ? value
    : JSON.stringify(value)
  if (!text) return String(value)
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}
