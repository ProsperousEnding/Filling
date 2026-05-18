<template>
  <span v-if="false"></span>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useConfigStore } from '../../stores/config'

const externalScriptLoaders = new Map()
const externalStyleLoaders = new Map()
let enhancementObserver = null
let enhancementFrame = 0
let mermaidRenderCounter = 0

const route = useRoute()
const configStore = useConfigStore()

function resolveCodeBlockFromTarget(target) {
  return target instanceof Element
    ? target.closest('.markdown-code-block')
    : null
}

function escapeFallbackHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function copyText(value) {
  const text = String(value || '')

  if (!text) {
    return false
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to execCommand fallback.
    }
  }

  if (typeof document === 'undefined') {
    return false
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'readonly')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.select()

  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }

  document.body.removeChild(textarea)
  return copied
}

function handleToggle(button, block) {
  const isCollapsed = block.classList.toggle('is-collapsed')
  const expandLabel = button.getAttribute('data-expand-label') || '展开代码'
  const collapseLabel = button.getAttribute('data-collapse-label') || '收起代码'

  button.textContent = isCollapsed ? expandLabel : collapseLabel
  button.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true')
}

async function handleCopy(button, block) {
  const codeElement = block.querySelector('code')
  const text = codeElement?.textContent || ''
  const success = await copyText(text)

  if (!success) {
    return
  }

  const defaultLabel = button.getAttribute('data-copy-label') || '复制代码'
  const copiedLabel = button.getAttribute('data-copied-label') || '已复制'
  button.textContent = copiedLabel
  button.classList.add('is-copied')

  window.setTimeout(() => {
    button.textContent = defaultLabel
    button.classList.remove('is-copied')
  }, 1600)
}

async function handleClick(event) {
  const target = event.target

  if (!(target instanceof Element)) {
    return
  }

  const button = target.closest('.markdown-code-block__button')

  if (!(button instanceof HTMLButtonElement)) {
    return
  }

  const block = resolveCodeBlockFromTarget(button)

  if (!block) {
    return
  }

  if (button.classList.contains('markdown-code-block__toggle')) {
    handleToggle(button, block)
    return
  }

  if (button.classList.contains('markdown-code-block__copy')) {
    await handleCopy(button, block)
  }
}

function loadExternalScript(src) {
  const normalizedSrc = String(src || '').trim()

  if (!normalizedSrc) {
    return Promise.reject(new Error('Missing script URL'))
  }

  if (externalScriptLoaders.has(normalizedSrc)) {
    return externalScriptLoaders.get(normalizedSrc)
  }

  const loader = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = normalizedSrc
    script.async = true
    script.onload = () => resolve(script)
    script.onerror = () => reject(new Error(`Failed to load script: ${normalizedSrc}`))
    document.head.appendChild(script)
  })

  externalScriptLoaders.set(normalizedSrc, loader)
  return loader
}

function loadExternalStyle(href) {
  const normalizedHref = String(href || '').trim()

  if (!normalizedHref) {
    return Promise.resolve()
  }

  if (externalStyleLoaders.has(normalizedHref)) {
    return externalStyleLoaders.get(normalizedHref)
  }

  const loader = new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = normalizedHref
    link.onload = () => resolve(link)
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${normalizedHref}`))
    document.head.appendChild(link)
  })

  externalStyleLoaders.set(normalizedHref, loader)
  return loader
}

function resolveMermaidTheme(mermaidConfig = {}) {
  return configStore.theme === 'dark'
    ? mermaidConfig.darkTheme || mermaidConfig.theme || 'dark'
    : mermaidConfig.theme || 'default'
}

function resetMermaidBlocks() {
  document.querySelectorAll('.markdown-mermaid').forEach((block) => {
    const code = block.getAttribute('data-mermaid-code') || ''

    block.removeAttribute('data-rendered')
    block.classList.remove('is-error')

    if (code) {
      block.innerHTML = `<pre class="markdown-mermaid__fallback"><code>${escapeFallbackHtml(code)}</code></pre>`
    }
  })
}

function resetMathNodes() {
  document.querySelectorAll('.markdown-math').forEach((node) => {
    const tex = node.getAttribute('data-tex') || ''

    node.removeAttribute('data-rendered')
    node.classList.remove('is-error')

    if (tex) {
      node.textContent = tex
    }
  })
}

async function renderMermaidBlocks(markdownConfig = {}) {
  const mermaidConfig = markdownConfig.mermaid || {}

  if (!mermaidConfig.enabled) {
    return
  }

  const blocks = Array.from(document.querySelectorAll('.markdown-mermaid'))
    .filter(block => !block.getAttribute('data-rendered'))

  if (blocks.length === 0) {
    return
  }

  if (!mermaidConfig.render) {
    blocks.forEach(block => block.setAttribute('data-rendered', 'skipped'))
    return
  }

  try {
    await loadExternalScript(mermaidConfig.scriptUrl)
  } catch (error) {
    console.warn(error)
    blocks.forEach((block) => {
      block.setAttribute('data-rendered', 'error')
      block.classList.add('is-error')
    })
    return
  }

  const mermaid = window.mermaid

  if (!mermaid?.initialize || !mermaid?.render) {
    blocks.forEach(block => block.setAttribute('data-rendered', 'error'))
    return
  }

  mermaid.initialize({
    startOnLoad: false,
    theme: resolveMermaidTheme(mermaidConfig),
    securityLevel: mermaidConfig.securityLevel || 'strict'
  })

  for (const block of blocks) {
    const code = block.getAttribute('data-mermaid-code') || block.textContent || ''

    if (!code.trim()) {
      block.setAttribute('data-rendered', 'skipped')
      continue
    }

    block.setAttribute('data-rendered', 'pending')

    try {
      mermaidRenderCounter += 1
      const result = await mermaid.render(`filling-mermaid-${Date.now()}-${mermaidRenderCounter}`, code)
      block.innerHTML = result.svg
      result.bindFunctions?.(block)
      block.setAttribute('data-rendered', 'true')
    } catch (error) {
      console.warn(error)
      block.setAttribute('data-rendered', 'error')
      block.classList.add('is-error')
    }
  }
}

async function renderMathNodes(markdownConfig = {}) {
  const mathConfig = markdownConfig.math || {}

  if (!mathConfig.enabled || mathConfig.engine !== 'katex') {
    return
  }

  const nodes = Array.from(document.querySelectorAll('.markdown-math'))
    .filter(node => !node.getAttribute('data-rendered'))

  if (nodes.length === 0) {
    return
  }

  if (!mathConfig.render) {
    nodes.forEach(node => node.setAttribute('data-rendered', 'skipped'))
    return
  }

  try {
    await Promise.all([
      loadExternalStyle(mathConfig.cssUrl),
      loadExternalScript(mathConfig.scriptUrl)
    ])
  } catch (error) {
    console.warn(error)
    nodes.forEach((node) => {
      node.setAttribute('data-rendered', 'error')
      node.classList.add('is-error')
    })
    return
  }

  const katex = window.katex

  if (!katex?.render) {
    nodes.forEach(node => node.setAttribute('data-rendered', 'error'))
    return
  }

  nodes.forEach((node) => {
    const tex = node.getAttribute('data-tex') || ''

    if (!tex.trim()) {
      node.setAttribute('data-rendered', 'skipped')
      return
    }

    node.setAttribute('data-rendered', 'pending')

    try {
      katex.render(tex, node, {
        displayMode: node.getAttribute('data-display-mode') === 'true',
        throwOnError: mathConfig.throwOnError,
        errorColor: mathConfig.errorColor,
        strict: mathConfig.strict
      })
      node.setAttribute('data-rendered', 'true')
    } catch (error) {
      console.warn(error)
      node.setAttribute('data-rendered', 'error')
      node.classList.add('is-error')
    }
  })
}

async function runMarkdownEnhancements({ resetMermaid = false, resetMath = false } = {}) {
  if (typeof document === 'undefined') {
    return
  }

  await nextTick()

  if (resetMermaid) {
    resetMermaidBlocks()
  }

  if (resetMath) {
    resetMathNodes()
  }

  await renderMathNodes(configStore.markdownConfig)
  await renderMermaidBlocks(configStore.markdownConfig)
}

function scheduleMarkdownEnhancements(options = {}) {
  if (typeof window === 'undefined') {
    return
  }

  if (enhancementFrame) {
    window.cancelAnimationFrame(enhancementFrame)
  }

  enhancementFrame = window.requestAnimationFrame(() => {
    enhancementFrame = 0
    runMarkdownEnhancements(options)
  })
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleClick)

    const observeTarget = document.querySelector('.theme-main') || document.body
    enhancementObserver = new MutationObserver(() => {
      scheduleMarkdownEnhancements()
    })
    enhancementObserver.observe(observeTarget, {
      childList: true,
      subtree: true
    })
    scheduleMarkdownEnhancements()
  }
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleClick)
  }

  if (typeof window !== 'undefined' && enhancementFrame) {
    window.cancelAnimationFrame(enhancementFrame)
  }

  enhancementObserver?.disconnect()
  enhancementObserver = null
})

watch(
  () => route.fullPath,
  () => scheduleMarkdownEnhancements()
)

watch(
  () => configStore.theme,
  () => scheduleMarkdownEnhancements({ resetMermaid: true })
)

watch(
  () => JSON.stringify(configStore.markdownConfig || {}),
  () => scheduleMarkdownEnhancements({ resetMermaid: true, resetMath: true })
)
</script>
