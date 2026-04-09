<template>
  <component :is="tag" ref="elementRef" v-bind="attrs">
    {{ displayText }}
  </component>
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import { usePretextLayout } from '../../composables/usePretextLayout'

defineOptions({
  inheritAttrs: false
})

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
  lines: {
    type: Number,
    default: 1
  }
})

const attrs = useAttrs()
const { elementRef, displayValue: displayText } = usePretextLayout({
  sourceText: computed(() => String(props.text || '')),
  availableWidth: computed(() => props.availableWidth),
  lines: computed(() => props.lines)
})
</script>
