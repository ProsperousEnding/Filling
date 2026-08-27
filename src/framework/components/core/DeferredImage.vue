<template>
  <img
    ref="imageRef"
    :src="resolvedSource || undefined"
    :srcset="resolvedSourceSet || undefined"
    :loading="normalizedLoading"
    :data-image-state="imageState"
    decoding="async"
    @load="handleLoad"
    @error="handleError"
  />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { resolveOptimizedArticleCoverSource } from '../../utils/articleCover'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  srcset: {
    type: String,
    default: ''
  },
  loading: {
    type: String,
    default: 'lazy'
  },
  rootMargin: {
    type: String,
    default: '96px 0px'
  }
})

const emit = defineEmits(['load', 'error'])

const imageRef = ref(null)
const shouldLoad = ref(props.loading === 'eager')
const fallbackSource = ref('')
const hasLoaded = ref(false)
const normalizedLoading = computed(() => (props.loading === 'eager' ? 'eager' : 'lazy'))
const imageState = computed(() => (hasLoaded.value ? 'loaded' : shouldLoad.value ? 'loading' : 'idle'))
const resolvedSource = computed(() => (
  shouldLoad.value ? fallbackSource.value || String(props.src || '').trim() : ''
))
const resolvedSourceSet = computed(() => (
  shouldLoad.value && !fallbackSource.value ? String(props.srcset || '').trim() : ''
))
let observer

function startObserving() {
  if (shouldLoad.value || !imageRef.value) return

  if (typeof IntersectionObserver !== 'function') {
    shouldLoad.value = true
    return
  }

  observer = new IntersectionObserver((entries) => {
    if (!entries.some(entry => entry.isIntersecting)) return

    shouldLoad.value = true
    observer?.disconnect()
    observer = undefined
  }, {
    rootMargin: props.rootMargin
  })
  observer.observe(imageRef.value)
}

function handleError(event) {
  hasLoaded.value = false

  if (!fallbackSource.value) {
    const originalSource = resolveOptimizedArticleCoverSource(props.src)

    if (originalSource) {
      fallbackSource.value = originalSource
      return
    }
  }

  emit('error', event)
}

function handleLoad(event) {
  hasLoaded.value = true
  emit('load', event)
}

watch(() => [props.src, props.srcset], () => {
  fallbackSource.value = ''
  hasLoaded.value = false
})

watch(normalizedLoading, (loading) => {
  if (loading === 'eager') {
    shouldLoad.value = true
    observer?.disconnect()
    observer = undefined
  }
})

onMounted(() => {
  startObserving()

  if (imageRef.value?.complete && imageRef.value.naturalWidth > 0) {
    hasLoaded.value = true
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<style scoped>
img {
  opacity: 0;
  transition-property: opacity, transform;
  transition-duration: 180ms, var(--deferred-image-transform-duration, 200ms);
  transition-timing-function: ease-out;
}

img[data-image-state='loaded'] {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  img {
    transition-duration: 0ms;
  }
}
</style>
