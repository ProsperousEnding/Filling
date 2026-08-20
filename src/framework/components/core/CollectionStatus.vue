<template>
  <div
    v-if="visible"
    class="collection-status py-8 text-center"
    :class="{ 'collection-status--compact': ready }"
    role="status"
    aria-live="polite"
  >
    <div v-if="loading" class="theme-loading-inline inline-flex items-center">
      <svg
        class="animate-spin mr-3 h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {{ ready ? refreshingText : loadingText }}
    </div>

    <div v-else-if="error" class="collection-status-error">
      <p class="theme-page-description">{{ errorText }}</p>
      <button
        type="button"
        class="collection-status-retry mt-3 inline-flex items-center justify-center px-4 py-2 text-sm font-medium"
        @click="$emit('retry')"
      >
        重新加载
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  ready: {
    type: Boolean,
    default: false
  },
  error: {
    type: [Error, Object, String],
    default: null
  },
  loadingText: {
    type: String,
    default: '正在加载内容...'
  },
  refreshingText: {
    type: String,
    default: '正在更新内容...'
  },
  errorText: {
    type: String,
    default: '内容加载失败，请稍后重试。'
  }
})

defineEmits(['retry'])

const visible = computed(() => props.loading || Boolean(props.error) || !props.ready)
</script>

<style scoped>
.collection-status--compact {
  padding-block: 0.75rem;
}

.collection-status-retry {
  color: var(--theme-link-color, rgb(37 99 235));
  border: 1px solid currentColor;
  border-radius: 6px;
  background: transparent;
  transition: background-color 160ms ease, color 160ms ease;
}

.collection-status-retry:hover {
  color: var(--theme-link-hover-color, rgb(29 78 216));
  background: rgb(37 99 235 / 0.08);
}

.collection-status-retry:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>
