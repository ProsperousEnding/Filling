import { computed, nextTick, ref, unref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

function normalizePage(value) {
  const page = Number.parseInt(value, 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function normalizePageSize(value, fallback = 10) {
  const pageSize = Number.parseInt(value, 10)
  return Number.isFinite(pageSize) && pageSize > 0 ? pageSize : fallback
}

function calculateTotalPages(total, pageSize) {
  const totalCount = Math.max(0, Number(total) || 0)
  const resolvedPageSize = normalizePageSize(pageSize)
  return Math.max(1, Math.ceil(totalCount / resolvedPageSize))
}

function buildDefaultPageRoute(route, page) {
  const normalizedPage = normalizePage(page)
  const nextQuery = {
    ...route.query
  }

  if (normalizedPage <= 1) {
    delete nextQuery.page
  } else {
    nextQuery.page = normalizedPage
  }

  return {
    path: route.path,
    query: nextQuery
  }
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
  let activeRequestId = 0

  const resolvedPageSize = computed(() => normalizePageSize(unref(pageSize)))
  const currentPage = computed(() => normalizePage(route.params.page ?? route.query.page))
  const totalPages = computed(() => calculateTotalPages(total.value, resolvedPageSize.value))

  function resolvePageLocation(page) {
    const normalizedPage = normalizePage(page)

    return typeof resolvePageRoute === 'function'
      ? resolvePageRoute({
        page: normalizedPage,
        currentPage: currentPage.value,
        route
      })
      : buildDefaultPageRoute(route, normalizedPage)
  }

  function isCurrentLocation(targetLocation) {
    return router.resolve(targetLocation).fullPath === route.fullPath
  }

  async function scrollToTop() {
    await nextTick()

    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  async function navigateToPage(page, options = {}) {
    const normalizedPage = normalizePage(page)
    const nextRoute = resolvePageLocation(normalizedPage)
    const replace = options.replace === true
    const shouldScroll = options.scroll !== false

    if (isCurrentLocation(nextRoute)) {
      return
    }

    await (replace ? router.replace(nextRoute) : router.push(nextRoute))

    if (shouldScroll) {
      await scrollToTop()
    }
  }

  async function refresh() {
    const requestId = activeRequestId + 1
    activeRequestId = requestId
    loading.value = true
    error.value = null

    try {
      const result = await fetchPage({
        page: currentPage.value,
        pageSize: resolvedPageSize.value,
        route
      })

      if (requestId !== activeRequestId) {
        return result
      }

      items.value = Array.isArray(result?.data) ? result.data : []
      total.value = Number(result?.total) || 0

      const canonicalPage = Math.min(currentPage.value, calculateTotalPages(total.value, resolvedPageSize.value))
      const canonicalLocation = resolvePageLocation(canonicalPage)

      if (!isCurrentLocation(canonicalLocation)) {
        await navigateToPage(canonicalPage, {
          replace: true,
          scroll: false
        })
      }

      return result
    } catch (fetchError) {
      if (requestId !== activeRequestId) {
        return null
      }

      error.value = fetchError
      items.value = []
      total.value = 0
      throw fetchError
    } finally {
      if (requestId === activeRequestId) {
        loading.value = false
      }
    }
  }

  function handlePageChange(page) {
    const nextPage = normalizePage(page)

    if (nextPage === currentPage.value) {
      return
    }

    navigateToPage(nextPage).catch(() => {})
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
    totalPages,
    refresh,
    handlePageChange
  }
}
