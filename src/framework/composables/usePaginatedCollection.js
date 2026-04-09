import { computed, ref, unref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

function normalizePage(value) {
  const page = Number.parseInt(value, 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function normalizePageSize(value, fallback = 10) {
  const pageSize = Number.parseInt(value, 10)
  return Number.isFinite(pageSize) && pageSize > 0 ? pageSize : fallback
}

export function usePaginatedCollection(options) {
  const {
    pageSize = 10,
    fetchPage,
    watchSources = [],
    resolvePageRoute = null
  } = options

  const route = useRoute()
  const router = useRouter()

  const items = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)

  const resolvedPageSize = computed(() => normalizePageSize(unref(pageSize)))
  const currentPage = computed(() => normalizePage(route.params.page ?? route.query.page))

  async function refresh() {
    loading.value = true
    error.value = null

    try {
      const result = await fetchPage({
        page: currentPage.value,
        pageSize: resolvedPageSize.value,
        route
      })

      items.value = Array.isArray(result?.data) ? result.data : []
      total.value = Number(result?.total) || 0
      return result
    } catch (fetchError) {
      error.value = fetchError
      items.value = []
      total.value = 0
      throw fetchError
    } finally {
      loading.value = false
    }
  }

  function handlePageChange(page) {
    const nextPage = normalizePage(page)

    if (nextPage === currentPage.value) {
      return
    }

    const nextRoute = typeof resolvePageRoute === 'function'
      ? resolvePageRoute({
        page: nextPage,
        currentPage: currentPage.value,
        route
      })
      : {
        path: route.path,
        query: {
          ...route.query,
          page: nextPage
        }
      }

    router.push(nextRoute)

    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  watch(
    [() => route.path, () => route.params.page, () => route.query.page, resolvedPageSize, ...watchSources],
    () => {
      refresh().catch(() => {})
    },
    { immediate: true }
  )

  return {
    items,
    total,
    loading,
    error,
    currentPage,
    pageSize: resolvedPageSize,
    refresh,
    handlePageChange
  }
}
