<template>
  <span v-if="false"></span>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useConfigStore } from '../../stores/config'
import { isThemeAssetPathAllowed, resolveThemeAssetUrl } from '../../utils/themeAsset'

const configStore = useConfigStore()
const themeCSSFile = computed(() => configStore.themeCSSFile)
const currentThemePreset = computed(() => String(configStore.currentThemePreset || '').trim())

let styleElement = null
let warnedThemeStylePath = ''

const updateCustomStyle = () => {
  const rawThemeFile = String(themeCSSFile.value || '').trim()
  const href = resolveThemeAssetUrl(rawThemeFile, import.meta.env.BASE_URL || '/')
  const root = typeof document !== 'undefined' ? document.documentElement : null

  if (root) {
    if (currentThemePreset.value) {
      root.dataset.themePreset = currentThemePreset.value
    } else {
      delete root.dataset.themePreset
    }
  }

  if (rawThemeFile && !isThemeAssetPathAllowed(rawThemeFile) && warnedThemeStylePath !== rawThemeFile) {
    console.warn(`[vue-blog] Blocked theme stylesheet from unsupported source: ${rawThemeFile}`)
    warnedThemeStylePath = rawThemeFile
  }

  if (!href) {
    if (styleElement) {
      document.head.removeChild(styleElement)
      styleElement = null
    }
    return
  }

  if (!styleElement) {
    styleElement = document.createElement('link')
    styleElement.rel = 'stylesheet'
    styleElement.id = 'vue-blog-theme-css'
    document.head.appendChild(styleElement)
  }

  if (styleElement.getAttribute('href') !== href) {
    styleElement.setAttribute('href', href)
  }
}

watch(themeCSSFile, updateCustomStyle)
watch(currentThemePreset, updateCustomStyle)

onMounted(() => {
  updateCustomStyle()
})

onUnmounted(() => {
  if (styleElement) {
    document.head.removeChild(styleElement)
    styleElement = null
  }
})
</script> 
