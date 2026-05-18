<template>
  <nav v-if="totalPages > 1" class="pagination-wrap mt-10" aria-label="分页导航">
    <div class="pagination-meta">
      <span class="pagination-summary">
        第 {{ currentPage }} / {{ totalPages }} 页
        <template v-if="normalizedTotalItems > 0">
          · 共 {{ normalizedTotalItems }} 项
        </template>
      </span>
    </div>

    <div class="pagination-shell inline-flex items-center justify-center gap-1.5 backdrop-blur-sm px-3 py-2 rounded-[1.5rem]">
      <button
        type="button"
        class="pagination-button pagination-button-edge hidden sm:inline-flex items-center justify-center rounded-full transition-all duration-200"
        :class="{ 'pagination-button-disabled': currentPage === 1 }"
        :disabled="currentPage === 1"
        aria-label="跳转到第一页"
        @click="onPageChange(1)"
      >
        首页
      </button>

      <button
        type="button"
        class="pagination-button pagination-button-icon inline-flex items-center justify-center rounded-full transition-all duration-200"
        :class="{ 'pagination-button-disabled': currentPage === 1 }"
        :disabled="currentPage === 1"
        aria-label="上一页"
        @click="onPageChange(currentPage - 1)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <template v-for="(page, index) in displayedPages" :key="`pagination-${page}-${index}`">
        <span
          v-if="page === '...'"
          class="pagination-ellipsis inline-flex items-center justify-center px-1.5 text-sm"
          aria-hidden="true"
        >
          ···
        </span>

        <button
          v-else
          type="button"
          class="pagination-button pagination-button-number inline-flex items-center justify-center rounded-full text-sm transition-all duration-200"
          :class="{ 'pagination-button-active': page === currentPage }"
          :aria-current="page === currentPage ? 'page' : undefined"
          :aria-label="page === currentPage ? `当前第 ${page} 页` : `跳转到第 ${page} 页`"
          @click="onPageChange(page)"
        >
          {{ page }}
        </button>
      </template>

      <button
        type="button"
        class="pagination-button pagination-button-icon inline-flex items-center justify-center rounded-full transition-all duration-200"
        :class="{ 'pagination-button-disabled': currentPage === totalPages }"
        :disabled="currentPage === totalPages"
        aria-label="下一页"
        @click="onPageChange(currentPage + 1)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button
        type="button"
        class="pagination-button pagination-button-edge hidden sm:inline-flex items-center justify-center rounded-full transition-all duration-200"
        :class="{ 'pagination-button-disabled': currentPage === totalPages }"
        :disabled="currentPage === totalPages"
        aria-label="跳转到最后一页"
        @click="onPageChange(totalPages)"
      >
        末页
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['page-change'])

const compactMode = ref(false)
let compactMediaQuery = null

function createDisplayedPages(currentPage, totalPages, maxVisiblePages) {
  const safeCurrentPage = Math.max(1, currentPage)
  const safeTotalPages = Math.max(1, totalPages)

  if (safeTotalPages <= maxVisiblePages) {
    return Array.from({ length: safeTotalPages }, (_, index) => index + 1)
  }

  const pages = [1]
  const innerWindowSize = Math.max(1, maxVisiblePages - 2)
  let start = Math.max(2, safeCurrentPage - Math.floor(innerWindowSize / 2))
  let end = Math.min(safeTotalPages - 1, start + innerWindowSize - 1)

  start = Math.max(2, end - innerWindowSize + 1)

  if (start > 2) {
    pages.push('...')
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (end < safeTotalPages - 1) {
    pages.push('...')
  }

  pages.push(safeTotalPages)

  return pages
}

const normalizedTotalItems = computed(() => Math.max(0, Number(props.totalItems) || 0))
const maxVisiblePages = computed(() => compactMode.value ? 3 : 5)
const displayedPages = computed(() => (
  createDisplayedPages(props.currentPage, props.totalPages, maxVisiblePages.value)
))

function syncCompactMode() {
  compactMode.value = compactMediaQuery?.matches === true
}

function onPageChange(page) {
  if (page < 1 || page > props.totalPages || page === props.currentPage) {
    return
  }

  emit('page-change', page)
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return
  }

  compactMediaQuery = window.matchMedia('(max-width: 640px)')
  syncCompactMode()

  if (typeof compactMediaQuery.addEventListener === 'function') {
    compactMediaQuery.addEventListener('change', syncCompactMode)
    return
  }

  compactMediaQuery.addListener(syncCompactMode)
})

onUnmounted(() => {
  if (!compactMediaQuery) {
    return
  }

  if (typeof compactMediaQuery.removeEventListener === 'function') {
    compactMediaQuery.removeEventListener('change', syncCompactMode)
    return
  }

  compactMediaQuery.removeListener(syncCompactMode)
})
</script>
