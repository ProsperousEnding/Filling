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

const resolvedRenderer = computed(() => (
  typeof props.renderer === 'string'
    ? resolveMenuRenderer(props.renderer)
    : props.renderer
))
</script>
