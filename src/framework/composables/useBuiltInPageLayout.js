import { computed, ref, unref, watch } from 'vue'
import { useConfigStore } from '../stores/config'
import { resolveBuiltInPageLayout } from '../utils/pageLayoutConfig'

const LAYOUT_STORAGE_PREFIX = 'vue-blog-layout:'

function resolveSourceValue(source) {
  return typeof source === 'function' ? source() : unref(source)
}

function readStoredLayout(storageKey) {
  if (typeof window === 'undefined' || !storageKey) {
    return ''
  }

  return String(window.localStorage.getItem(storageKey) || '').trim().toLowerCase()
}

function writeStoredLayout(storageKey, layout) {
  if (typeof window === 'undefined' || !storageKey) {
    return
  }

  if (layout) {
    window.localStorage.setItem(storageKey, layout)
    return
  }

  window.localStorage.removeItem(storageKey)
}

export function useBuiltInPageLayout(pageKeySource, requestedComponentSource = '') {
  const configStore = useConfigStore()
  const selectedLayout = ref('')

  const pageKey = computed(() => String(resolveSourceValue(pageKeySource) || '').trim().toLowerCase())
  const requestedComponent = computed(() => resolveSourceValue(requestedComponentSource))
  const storageKey = computed(() => (
    pageKey.value ? `${LAYOUT_STORAGE_PREFIX}${pageKey.value}` : ''
  ))
  const pageLayout = computed(() => resolveBuiltInPageLayout(
    pageKey.value,
    requestedComponent.value,
    configStore.pageLayouts
  ))
  const currentLayout = computed(() => (
    pageLayout.value.allowSwitch && pageLayout.value.availableLayouts.includes(selectedLayout.value)
      ? selectedLayout.value
      : pageLayout.value.defaultLayout
  ))
  const modelValue = computed({
    get() {
      return currentLayout.value
    },
    set(nextLayout) {
      const normalizedLayout = String(nextLayout || '').trim().toLowerCase()

      if (
        !pageLayout.value.allowSwitch
        || !pageLayout.value.availableLayouts.includes(normalizedLayout)
      ) {
        return
      }

      selectedLayout.value = normalizedLayout
    }
  })
  const collectionLayout = computed(() => ({
    currentLayout: currentLayout.value,
    availableLayouts: [...pageLayout.value.availableLayouts],
    allowSwitch: pageLayout.value.allowSwitch,
    persist: pageLayout.value.persist,
    columns: pageLayout.value.columns,
    wideColumns: pageLayout.value.wideColumns
  }))

  watch(
    [pageLayout, storageKey],
    ([nextLayout, nextStorageKey]) => {
      if (!nextLayout.allowSwitch) {
        selectedLayout.value = ''
        writeStoredLayout(nextStorageKey, '')
        return
      }

      const storedLayout = nextLayout.persist
        ? readStoredLayout(nextStorageKey)
        : ''
      selectedLayout.value = nextLayout.availableLayouts.includes(storedLayout)
        ? storedLayout
        : nextLayout.defaultLayout
    },
    { immediate: true }
  )

  watch(
    [currentLayout, pageLayout, storageKey],
    ([nextLayout, nextPageLayout, nextStorageKey]) => {
      if (!nextPageLayout.allowSwitch || !nextPageLayout.persist) {
        writeStoredLayout(nextStorageKey, '')
        return
      }

      writeStoredLayout(
        nextStorageKey,
        nextLayout === nextPageLayout.defaultLayout ? '' : nextLayout
      )
    },
    { immediate: true }
  )

  return {
    pageLayout,
    collectionLayout,
    currentLayout,
    modelValue,
    switcherVisible: computed(() => pageLayout.value.allowSwitch)
  }
}
