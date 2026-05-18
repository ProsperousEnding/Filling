<template>
  <div
    v-if="resolvedOptions.length > 1"
    class="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-slate-200/80 bg-white/85 p-1 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/70"
    role="tablist"
    aria-label="列表布局切换"
  >
    <button
      v-for="option in resolvedOptions"
      :key="option"
      type="button"
      class="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200"
      :class="option === modelValue
        ? 'bg-primary/10 text-primary dark:bg-primary/20'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/90 dark:hover:text-slate-100'"
      :aria-pressed="option === modelValue ? 'true' : 'false'"
      @click="$emit('update:modelValue', option)"
    >
      {{ getOptionLabel(option) }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { SWITCHABLE_PAGE_LAYOUT_KEYS } from '../../utils/pageLayoutConfig'

const OPTION_LABELS = Object.freeze({
  list: '列表',
  card: '卡片',
  grid: '网格',
  timeline: '时间线'
})

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    default: () => []
  }
})

defineEmits(['update:modelValue'])

const resolvedOptions = computed(() => {
  const normalizedOptions = Array.isArray(props.options) ? props.options : []

  return normalizedOptions.filter((option, index) => (
    SWITCHABLE_PAGE_LAYOUT_KEYS.includes(option) && normalizedOptions.indexOf(option) === index
  ))
})

function getOptionLabel(option) {
  return OPTION_LABELS[option] || option
}
</script>
