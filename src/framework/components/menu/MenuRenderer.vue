<template>
  <component
    :is="resolvedRenderer"
    v-if="resolvedRenderer"
    v-bind="rendererProps"
    @select="emit('select', $event)"
  />
</template>

<script setup>
import { computed } from 'vue'
import { resolveMenuRenderer } from './menuRegistry'

const warnedRenderers = new Set()

const props = defineProps({
  renderer: {
    type: [String, Object],
    required: true
  },
  rendererProps: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['select'])

const resolvedRenderer = computed(() => {
  const renderer = typeof props.renderer === 'string'
    ? resolveMenuRenderer(props.renderer)
    : props.renderer

  if (
    import.meta.env.DEV
    && !renderer
    && typeof props.renderer === 'string'
    && !warnedRenderers.has(props.renderer)
  ) {
    warnedRenderers.add(props.renderer)
    console.warn(`[vue-blog] Unknown menu renderer: ${props.renderer}`)
  }

  return renderer
})
</script>
