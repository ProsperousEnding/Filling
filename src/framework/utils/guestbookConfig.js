const DEFAULT_GUESTBOOK_CONFIG = Object.freeze({
  enabled: false,
  kicker: '留言板',
  title: '欢迎留下你的来访足迹',
  description: '如果你路过这里，可以简单介绍自己，或者留下一句想说的话。',
  guidelines: [],
  template: '',
  contact_label: '',
  contact_url: '',
  comment_title: '开始留言',
  comment_description: '评论区会按当前页面路径独立保存留言内容。',
  comment_not_ready_text: '',
  comment: Object.freeze({
    enabled: true,
    provider: '',
    title: '开始留言',
    description: '评论区会按当前页面路径独立保存留言内容。',
    not_ready_text: '',
    giscus: Object.freeze({}),
    utterances: Object.freeze({})
  })
})

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function transformKeysDeep(value, transformKey) {
  if (Array.isArray(value)) {
    return value.map(item => transformKeysDeep(item, transformKey))
  }

  if (!isPlainObject(value)) {
    return value
  }

  return Object.entries(value).reduce((result, [key, nestedValue]) => {
    result[transformKey(key)] = transformKeysDeep(nestedValue, transformKey)
    return result
  }, {})
}

function toCamelKey(key) {
  return String(key || '').replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function toCamelCase(value) {
  return transformKeysDeep(value, toCamelKey)
}

function normalizeString(value, fallback = '') {
  const normalized = String(value || '').trim()
  return normalized || fallback
}

function normalizeStringList(values = []) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map(value => normalizeString(value))
    .filter(Boolean)
}

function normalizeLink(value) {
  const normalized = normalizeString(value)

  if (!normalized) {
    return {
      url: '',
      external: false
    }
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(normalized)) {
    return {
      url: normalized,
      external: true
    }
  }

  if (!normalized.startsWith('/') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(normalized)) {
    return {
      url: '',
      external: false
    }
  }

  return {
    url: normalized,
    external: false
  }
}

function normalizeGuestbookCommentConfig(merged = {}) {
  const commentSource = isPlainObject(merged.comment) ? merged.comment : {}
  const comment = toCamelCase(commentSource)
  const enabled = typeof comment.enabled === 'boolean'
    ? comment.enabled
    : DEFAULT_GUESTBOOK_CONFIG.comment.enabled

  return {
    enabled,
    provider: normalizeString(comment.provider),
    title: normalizeString(
      comment.title || merged.commentTitle || merged.comment_title,
      DEFAULT_GUESTBOOK_CONFIG.comment.title
    ),
    description: normalizeString(
      comment.description || merged.commentDescription || merged.comment_description,
      DEFAULT_GUESTBOOK_CONFIG.comment.description
    ),
    notReadyText: normalizeString(
      comment.notReadyText || merged.commentNotReadyText || merged.comment_not_ready_text
    ),
    giscus: isPlainObject(comment.giscus) ? comment.giscus : {},
    utterances: isPlainObject(comment.utterances) ? comment.utterances : {}
  }
}

export { DEFAULT_GUESTBOOK_CONFIG }

export function normalizeGuestbookConfig(config = {}) {
  const normalizedConfig = isPlainObject(config) ? toCamelCase(config) : {}
  const merged = {
    ...DEFAULT_GUESTBOOK_CONFIG,
    ...normalizedConfig
  }
  const contact = normalizeLink(merged.contactUrl || merged.contact_url)
  const commentOptions = normalizeGuestbookCommentConfig(merged)

  return {
    enabled: merged.enabled === true,
    kicker: normalizeString(merged.kicker, DEFAULT_GUESTBOOK_CONFIG.kicker),
    title: normalizeString(merged.title, DEFAULT_GUESTBOOK_CONFIG.title),
    description: normalizeString(merged.description, DEFAULT_GUESTBOOK_CONFIG.description),
    guidelines: normalizeStringList(merged.guidelines),
    template: normalizeString(merged.template),
    contactLabel: normalizeString(merged.contactLabel || merged.contact_label),
    contactUrl: contact.url,
    contactExternal: contact.external,
    commentTitle: commentOptions.title,
    commentDescription: commentOptions.description,
    commentNotReadyText: commentOptions.notReadyText,
    commentOptions
  }
}
