<template>
  <component :is="tag" ref="elementRef" v-bind="attrs" v-html="displayHtml"></component>
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import { usePretextLayout } from '../../composables/usePretextLayout'

defineOptions({
  inheritAttrs: false
})

const CONTEXT_BEFORE = 72
const CONTEXT_AFTER = 220
const EDGE_ELLIPSIS = '\u2026'

const props = defineProps({
  tag: {
    type: String,
    default: 'span'
  },
  text: {
    type: String,
    default: ''
  },
  availableWidth: {
    type: Number,
    default: null
  },
  keywords: {
    type: Array,
    default: () => []
  },
  lines: {
    type: Number,
    default: 1
  },
  highlightClass: {
    type: String,
    default: 'theme-search-highlight'
  }
})

const attrs = useAttrs()
const normalizedText = computed(() => String(props.text || '').replace(/\s+/g, ' ').trim())
const normalizedKeywords = computed(() => (
  (Array.isArray(props.keywords) ? props.keywords : [])
    .map(keyword => String(keyword || '').trim())
    .filter(Boolean)
))

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeRegExp(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getFocusedSnippet(text, keywords) {
  if (!text) {
    return ''
  }

  const loweredText = text.toLowerCase()
  let firstMatchIndex = Number.POSITIVE_INFINITY
  let matchedKeywordLength = 0

  keywords.forEach((keyword) => {
    const loweredKeyword = keyword.toLowerCase()
    const currentIndex = loweredText.indexOf(loweredKeyword)

    if (currentIndex !== -1 && currentIndex < firstMatchIndex) {
      firstMatchIndex = currentIndex
      matchedKeywordLength = loweredKeyword.length
    }
  })

  if (!Number.isFinite(firstMatchIndex)) {
    const end = Math.min(text.length, CONTEXT_BEFORE + CONTEXT_AFTER)
    return `${text.slice(0, end).trimEnd()}${end < text.length ? EDGE_ELLIPSIS : ''}`
  }

  const start = Math.max(0, firstMatchIndex - CONTEXT_BEFORE)
  const end = Math.min(text.length, firstMatchIndex + matchedKeywordLength + CONTEXT_AFTER)
  const prefix = start > 0 ? EDGE_ELLIPSIS : ''
  const suffix = end < text.length ? EDGE_ELLIPSIS : ''

  return `${prefix}${text.slice(start, end).trim()}${suffix}`
}

function highlightText(text) {
  let nextHtml = escapeHtml(text)

  normalizedKeywords.value.forEach((keyword) => {
    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi')
    nextHtml = nextHtml.replace(regex, `<mark class="${props.highlightClass}">$1</mark>`)
  })

  return nextHtml
}

const keywordSignature = computed(() => normalizedKeywords.value.join('\u0001'))
const sourceText = computed(() => getFocusedSnippet(normalizedText.value, normalizedKeywords.value))
const { elementRef, displayValue: displayHtml } = usePretextLayout({
  sourceText,
  availableWidth: computed(() => props.availableWidth),
  lines: computed(() => props.lines),
  watchSources: [keywordSignature],
  renderOutput: highlightText
})
</script>
