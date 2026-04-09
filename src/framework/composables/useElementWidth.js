import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

export function useElementWidth() {
  const elementRef = ref(null)
  const width = ref(0)

  let resizeObserver = null
  let animationFrameId = 0

  function measureWidth() {
    const element = elementRef.value

    if (!element) {
      width.value = 0
      return
    }

    width.value = element.clientWidth || element.getBoundingClientRect().width || 0
  }

  function scheduleMeasure() {
    if (typeof window === 'undefined') {
      return
    }

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    animationFrameId = window.requestAnimationFrame(() => {
      animationFrameId = 0
      measureWidth()
    })
  }

  onMounted(async () => {
    await nextTick()

    if (!elementRef.value || typeof window === 'undefined') {
      return
    }

    resizeObserver = new ResizeObserver(() => {
      scheduleMeasure()
    })
    resizeObserver.observe(elementRef.value)

    scheduleMeasure()

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        scheduleMeasure()
      })
    }
  })

  onBeforeUnmount(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    resizeObserver?.disconnect()
    resizeObserver = null
  })

  return {
    elementRef,
    width
  }
}
