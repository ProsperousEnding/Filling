import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'

const defaultGraphemeSegmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null
const graphemeCache = new Map()

function splitGraphemes(text) {
  if (!text) {
    return []
  }

  if (graphemeCache.has(text)) {
    return graphemeCache.get(text)
  }

  const segments = defaultGraphemeSegmenter
    ? Array.from(defaultGraphemeSegmenter.segment(text), ({ segment }) => segment)
    : Array.from(text)

  graphemeCache.set(text, segments)
  return segments
}

function getFontShorthand(style) {
  if (style.font && style.font !== 'normal normal normal normal 16px / normal serif') {
    return style.font
  }

  return [
    style.fontStyle,
    style.fontVariant,
    style.fontWeight,
    style.fontStretch,
    style.fontSize,
    style.fontFamily
  ]
    .filter(Boolean)
    .join(' ')
}

function slicePreparedText(prepared, endCursor) {
  const segments = Array.isArray(prepared?.segments) ? prepared.segments : []
  const safeSegmentIndex = Math.max(0, Number(endCursor?.segmentIndex) || 0)
  const safeGraphemeIndex = Math.max(0, Number(endCursor?.graphemeIndex) || 0)
  const parts = []

  for (let index = 0; index < Math.min(safeSegmentIndex, segments.length); index += 1) {
    parts.push(segments[index])
  }

  if (safeSegmentIndex < segments.length && safeGraphemeIndex > 0) {
    const graphemes = splitGraphemes(segments[safeSegmentIndex])
    parts.push(graphemes.slice(0, safeGraphemeIndex).join(''))
  }

  return parts.join('')
}

export function usePretextLayout(options) {
  const {
    sourceText,
    lines = 1,
    availableWidth = null,
    watchSources = [],
    renderOutput = (text) => text
  } = options

  const elementRef = ref(null)
  const displayValue = ref(renderOutput(''))
  const normalizedText = computed(() => String(unref(sourceText) || ''))
  const normalizedWidth = computed(() => {
    if (availableWidth === null || availableWidth === undefined) {
      return 0
    }

    const resolvedWidth = Number(unref(availableWidth))
    return Number.isFinite(resolvedWidth) && resolvedWidth > 0 ? resolvedWidth : 0
  })
  const normalizedLines = computed(() => {
    const resolvedLines = Number.parseInt(unref(lines), 10)
    return Number.isFinite(resolvedLines) && resolvedLines > 0 ? resolvedLines : 1
  })

  let resizeObserver = null
  let animationFrameId = 0
  let preparedCacheKey = ''
  let preparedCacheValue = null

  function getPreparedText(text, font) {
    const cacheKey = `${font}::${text}`

    if (cacheKey !== preparedCacheKey) {
      preparedCacheKey = cacheKey
      preparedCacheValue = prepareWithSegments(text, font)
    }

    return preparedCacheValue
  }

  function measureText() {
    const element = elementRef.value

    if (!element) {
      return
    }

    const text = normalizedText.value
    const width = normalizedWidth.value || element.clientWidth || element.getBoundingClientRect().width

    if (!width || !text) {
      displayValue.value = renderOutput('')
      return
    }

    const style = window.getComputedStyle(element)
    const font = getFontShorthand(style)
    const lineHeight = Number.parseFloat(style.lineHeight)

    if (!font || !Number.isFinite(lineHeight) || lineHeight <= 0) {
      displayValue.value = renderOutput('')
      return
    }

    const prepared = getPreparedText(text, font)
    const layoutResult = layoutWithLines(prepared, width, lineHeight)

    if (layoutResult.lineCount <= normalizedLines.value) {
      displayValue.value = renderOutput(text)
      return
    }

    const lastVisibleLine = layoutResult.lines[normalizedLines.value - 1]
    const truncatedText = `${slicePreparedText(prepared, lastVisibleLine.end).trimEnd()}\u2026`
    displayValue.value = renderOutput(truncatedText)
  }

  function scheduleMeasure() {
    if (typeof window === 'undefined') {
      return
    }

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    animationFrameId = window.requestAnimationFrame(() => {
      animationFrameId = 0
      measureText()
    })
  }

  onMounted(async () => {
    await nextTick()

    if (!elementRef.value || typeof window === 'undefined') {
      return
    }

    if (availableWidth === null || availableWidth === undefined) {
      resizeObserver = new ResizeObserver(() => {
        scheduleMeasure()
      })
      resizeObserver.observe(elementRef.value)
    }

    scheduleMeasure()

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        scheduleMeasure()
      })
    }
  })

  watch([normalizedText, normalizedLines, normalizedWidth, ...watchSources], () => {
    preparedCacheKey = ''
    preparedCacheValue = null

    nextTick().then(() => {
      scheduleMeasure()
    })
  })

  onBeforeUnmount(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    resizeObserver?.disconnect()
    resizeObserver = null
  })

  return {
    elementRef,
    displayValue,
    scheduleMeasure
  }
}
