<template>
  <div class="archive-grid-page">
    <div class="theme-page-header mb-8">
      <h1 class="theme-page-title text-3xl font-bold mb-4">{{ title }}</h1>
      <p class="theme-page-description">{{ description }}</p>
    </div>

    <div class="archive-filter mb-8">
      <div class="flex flex-wrap gap-2">
        <router-link
          :to="getArchiveRoute()"
          class="theme-filter-chip px-4 py-2 rounded-full text-sm font-medium transition-colors"
          :class="{ 'theme-filter-chip-active': !hasSelectedYear }"
        >
          全部
        </router-link>
        <router-link
          v-for="year in availableYears"
          :key="year"
          :to="getArchiveRoute(year)"
          class="theme-filter-chip px-4 py-2 rounded-full text-sm font-medium transition-colors"
          :class="{ 'theme-filter-chip-active': selectedYear === year }"
        >
          {{ year }}
        </router-link>
      </div>
    </div>

    <div v-if="hasSelectedYear">
      <div v-if="groupedArticles.length > 0" class="space-y-10">
        <section
          v-for="group in groupedArticles"
          :key="group.monthNumber"
        >
          <h2 class="theme-section-heading theme-section-divider text-xl font-bold mb-4 pb-2">
            {{ group.month }}
          </h2>

          <div class="grid" :class="articleGridClass">
            <router-link
              v-for="article in group.articles"
              :key="article.id"
              :to="getArticleRoute(article)"
              class="theme-grid-card rounded-2xl p-5 transition-shadow flex flex-col gap-3"
            >
              <div class="flex items-start justify-between gap-4">
                <h3 class="theme-section-title text-lg font-bold">
                  {{ article.title }}
                </h3>
                <span class="theme-muted-note text-sm shrink-0">
                  {{ formatDate(article.createdAt || article.date) }}
                </span>
              </div>

              <div class="theme-inline-meta flex flex-wrap gap-2 text-sm">
                <router-link
                  v-if="article.category"
                  :to="getCategoryRoute(article.category)"
                  class="theme-inline-link"
                >
                  {{ typeof article.category === 'string' ? article.category : article.category.name }}
                </router-link>

                <router-link
                  v-for="tag in article.tags || []"
                  :key="typeof tag === 'string' ? tag : tag.id"
                  :to="getTagRoute(tag)"
                  class="theme-inline-link"
                >
                  #{{ typeof tag === 'string' ? tag : tag.name }}
                </router-link>
              </div>
            </router-link>
          </div>
        </section>
      </div>

      <div v-else class="theme-empty-state py-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="theme-empty-icon h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h2 class="theme-empty-title text-xl font-bold mb-2">暂无文章</h2>
        <p class="theme-empty-text mb-6">该年份内没有文章发布</p>
      </div>
    </div>

    <div v-else-if="archiveOverviewGroups.length > 0" class="grid" :class="overviewGridClass">
      <router-link
        v-for="group in archiveOverviewGroups"
        :key="group.year"
        :to="getArchiveRoute(group.year)"
        class="theme-grid-card rounded-2xl p-6 transition-shadow flex flex-col gap-4"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="theme-section-title text-2xl font-bold">
              {{ group.year }}
            </h2>
            <p class="theme-page-description mt-2">
              {{ group.count }} 篇文章
            </p>
          </div>
          <span class="theme-muted-note text-sm">查看归档</span>
        </div>

        <ul v-if="group.previewArticles.length > 0" class="space-y-2">
          <li
            v-for="article in group.previewArticles"
            :key="article.id"
            class="theme-inline-meta text-sm"
          >
            {{ formatDate(article.createdAt || article.date) }} · {{ article.title }}
          </li>
        </ul>
      </router-link>
    </div>

    <div v-else class="theme-empty-state py-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="theme-empty-icon h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h2 class="theme-empty-title text-xl font-bold mb-2">暂无文章</h2>
      <p class="theme-empty-text mb-6">这里还没有归档内容</p>
    </div>
  </div>
</template>

<script setup>
import { getArchiveRoute, getArticleRoute, getCategoryRoute, getTagRoute } from '../../utils/routeLinks'

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
  },
  overviewGridClass: {
    type: String,
    default: 'grid-cols-1 md:grid-cols-2 gap-6'
  },
  articleGridClass: {
    type: String,
    default: 'grid-cols-1 md:grid-cols-2 gap-4'
  }
})
</script>
