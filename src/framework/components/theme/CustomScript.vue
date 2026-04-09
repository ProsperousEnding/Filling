<template>
  <span v-if="false"></span>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useConfigStore } from '../../stores/config'
import { isThemeAssetPathAllowed, resolveThemeAssetUrl } from '../../utils/themeAsset'

const configStore = useConfigStore()
const themeJSFile = computed(() => configStore.themeJSFile)

let scriptElement = null
let warnedThemeScriptPath = ''

const updateCustomScript = () => {
  if (scriptElement) {
    document.body.removeChild(scriptElement)
    scriptElement = null
  }

  const rawThemeFile = String(themeJSFile.value || '').trim()

  if (rawThemeFile && !isThemeAssetPathAllowed(rawThemeFile) && warnedThemeScriptPath !== rawThemeFile) {
    console.warn(`[vue-blog] Blocked theme script from unsupported source: ${rawThemeFile}`)
    warnedThemeScriptPath = rawThemeFile
  }

  const src = resolveThemeAssetUrl(rawThemeFile, import.meta.env.BASE_URL || '/')

  if (!src) {
    return
  }

  scriptElement = document.createElement('script')
  scriptElement.type = 'text/javascript'
  scriptElement.id = 'vue-blog-theme-js'
  scriptElement.src = src
  scriptElement.defer = true
  document.body.appendChild(scriptElement)
}

watch(themeJSFile, updateCustomScript)

onMounted(() => {
  setTimeout(updateCustomScript, 0)
})

onUnmounted(() => {
  if (scriptElement) {
    document.body.removeChild(scriptElement)
    scriptElement = null
  }
})
</script> 
