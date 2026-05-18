<template>
  <span v-if="false"></span>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useConfigStore } from '../../stores/config'
import { buildFontConfigCss, resolveFontPreloadLinks } from '../../utils/fontConfig'

const configStore = useConfigStore()
const fontConfig = computed(() => configStore.fontConfig)

let styleElement = null
let preloadElements = []

function ensureStyleElement() {
  if (styleElement || typeof document === 'undefined') {
    return styleElement
  }

  styleElement = document.createElement('style')
  styleElement.id = 'vue-blog-font-config'
  document.head.appendChild(styleElement)
  return styleElement
}

function clearStyleElement() {
  if (styleElement?.parentNode) {
    styleElement.parentNode.removeChild(styleElement)
  }

  styleElement = null
}

function clearPreloadElements() {
  preloadElements.forEach((element) => {
    if (element?.parentNode) {
      element.parentNode.removeChild(element)
    }
  })

  preloadElements = []
}

function ensureFontAssets() {
  if (typeof document === 'undefined') {
    return
  }

  const cssText = buildFontConfigCss(fontConfig.value, import.meta.env.BASE_URL || '/')

  if (!cssText) {
    clearStyleElement()
    clearPreloadElements()
    return
  }

  const nextStyleElement = ensureStyleElement()
  if (nextStyleElement.textContent !== cssText) {
    nextStyleElement.textContent = cssText
  }

  clearPreloadElements()

  preloadElements = resolveFontPreloadLinks(fontConfig.value, import.meta.env.BASE_URL || '/').map((descriptor, index) => {
    const element = document.createElement('link')
    element.rel = 'preload'
    element.as = 'font'
    element.href = descriptor.href
    element.id = `vue-blog-font-preload-${index}`

    if (descriptor.type) {
      element.type = descriptor.type
    }

    if (descriptor.crossorigin) {
      element.crossOrigin = descriptor.crossorigin
    }

    document.head.appendChild(element)
    return element
  })
}

watch(fontConfig, ensureFontAssets, { deep: true })

onMounted(() => {
  ensureFontAssets()
})

onUnmounted(() => {
  clearStyleElement()
  clearPreloadElements()
})
</script>
