<template>
  <div class="article-list-page">
    <h1 class="theme-page-title text-3xl font-bold mb-8">{{ title }}</h1>

    <ArticleFeed
      :articles="articles"
      :total="total"
      :loading="loading"
      :current-page="currentPage"
      :page-size="pageSize"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import ArticleFeed from '../../components/core/ArticleFeed.vue'

defineProps({
  title: {
    type: String,
    default: ''
  },
  articles: {
    type: Array,
    default: () => []
  },
  total: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['page-change'])

function handlePageChange(page) {
  emit('page-change', page)
}
</script>
