<template>
  <div ref="containerRef"></div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  html: {
    type: String,
    default: ''
  }
})

const containerRef = ref(null)

watch(() => props.html, async () => {
  await nextTick()
  renderTrustedHtml()
}, { immediate: true })

onMounted(() => {
  renderTrustedHtml()
})

function renderTrustedHtml() {
  if (!containerRef.value) {
    return
  }

  containerRef.value.innerHTML = props.html || ''
  replayEmbeddedScripts(containerRef.value)
}

function replayEmbeddedScripts(container) {
  const scriptNodes = container.querySelectorAll('script')

  scriptNodes.forEach((originalScript) => {
    const executableScript = document.createElement('script')

    Array.from(originalScript.attributes).forEach((attribute) => {
      executableScript.setAttribute(attribute.name, attribute.value)
    })

    if (originalScript.textContent) {
      executableScript.textContent = originalScript.textContent
    }

    originalScript.parentNode?.replaceChild(executableScript, originalScript)
  })
}
</script>
