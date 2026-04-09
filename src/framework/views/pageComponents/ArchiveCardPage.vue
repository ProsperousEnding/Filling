<template>
  <ArchiveGridPage
    :title="title"
    :description="description"
    :available-years="availableYears"
    :selected-year="selectedYear"
    :has-selected-year="hasSelectedYear"
    :grouped-articles="groupedArticles"
    :archive-overview-groups="archiveOverviewGroups"
    :format-date="formatDate"
    overview-grid-class="grid-cols-1 gap-4"
    article-grid-class="grid-cols-1 gap-4"
  />
</template>

<script setup>
import ArchiveGridPage from './ArchiveGridPage.vue'

defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  availableYears: {
    type: Array,
    default: () => []
  },
  selectedYear: {
    type: Number,
    default: null
  },
  hasSelectedYear: {
    type: Boolean,
    default: false
  },
  groupedArticles: {
    type: Array,
    default: () => []
  },
  archiveOverviewGroups: {
    type: Array,
    default: () => []
  },
  formatDate: {
    type: Function,
    required: true
  }
})
</script>
