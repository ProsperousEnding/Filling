<template>
  <div class="article-feed-item article-item">
    <div
      class="article-feed-card relative h-52 sm:h-56 md:h-64 rounded-lg md:rounded-xl overflow-hidden transition-all duration-300 bg-cover bg-center"
      :class="showArticleCover(article) ? 'article-feed-card-with-cover' : 'article-feed-card-without-cover'"
      :style="getArticleCardStyle(article)"
    >
      <div class="article-feed-card-overlay absolute inset-0"></div>

      <div
        v-if="!showArticleCover(article) && showCoverPlaceholder"
        class="article-feed-card-fallback absolute inset-0 flex items-center justify-center"
        :data-placeholder="coverListConfig.placeholder"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 md:h-16 md:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <div class="article-feed-card-content absolute inset-0 flex flex-col justify-between p-4 sm:p-5 md:p-6 z-10">
        <div class="article-feed-head flex justify-between items-start">
          <div v-if="article.category">
            <component
              :is="categoryPageEnabled ? 'router-link' : 'span'"
              :to="categoryPageEnabled ? getCategoryRoute(article.category) : undefined"
              class="article-feed-category inline-block px-2 py-0.5 md:px-3 md:py-1 text-xs font-medium rounded-full transition-colors duration-200"
            >
              {{ typeof article.category === 'string' ? article.category : article.category.name }}
            </component>
          </div>

          <div v-if="article.tags && article.tags.length > 0" class="article-feed-tags flex flex-wrap justify-end">
            <component
              v-for="tag in article.tags.slice(0, isSmallScreen ? 1 : 3)"
              :key="typeof tag === 'string' ? tag : tag.id"
              :is="tagPageEnabled ? 'router-link' : 'span'"
              :to="tagPageEnabled ? getTagRoute(tag) : undefined"
              class="article-feed-tag ml-1 md:ml-2 mb-1 px-2 py-0.5 text-xs rounded-full transition-colors duration-200"
            >
              #{{ typeof tag === 'string' ? tag : tag.name }}
            </component>
            <span v-if="article.tags.length > (isSmallScreen ? 1 : 3)" class="article-feed-tag-more text-xs ml-1 md:ml-2">
              +{{ article.tags.length - (isSmallScreen ? 1 : 3) }}
            </span>
          </div>
        </div>

        <div ref="textBlockRef" class="article-feed-body mt-4 md:mt-6 mb-auto">
          <h2 class="article-feed-title text-lg md:text-xl leading-[1.32] font-semibold transition-colors duration-200">
            <router-link :to="getArticleRoute(article)" class="article-feed-title-link block">
              <MeasuredText
                tag="span"
                class="block"
                :text="article.title"
                :lines="2"
                :available-width="textBlockWidth"
              />
            </router-link>
          </h2>

          <MeasuredText
            tag="p"
            class="article-feed-excerpt text-xs md:text-sm leading-relaxed mt-1 md:mt-2 mb-2 md:mb-3 max-w-3xl"
            :text="article.excerpt"
            :lines="isSmallScreen ? 1 : 2"
            :available-width="textBlockWidth"
          />
        </div>

        <div class="article-feed-footer flex items-center justify-between gap-4">
          <div class="flex flex-col">
            <div class="article-feed-date-row hidden sm:flex items-center text-xs">
              <time class="article-feed-date flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ formatDate(article.publishDate || article.createdAt) }}
              </time>
            </div>
            <div class="article-feed-date-row article-feed-date-mobile flex sm:hidden items-center text-xs">
              <time class="article-feed-date">{{ formatShortDate(article.publishDate || article.createdAt) }}</time>
            </div>
          </div>

          <router-link :to="getArticleRoute(article)" class="article-feed-read-link px-3 py-1 md:px-4 md:py-1.5 text-xs font-medium rounded-full transition-colors duration-300 flex items-center">
            阅读
            <span class="hidden sm:inline">全文</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 md:h-3.5 md:w-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useElementWidth } from '../../composables/useElementWidth'
import { useConfigStore } from '../../stores/config'
import { resolveDisplayArticleCover } from '../../utils/articleCover'
import { getArticleRoute, getCategoryRoute, getTagRoute } from '../../utils/routeLinks'
import MeasuredText from './MeasuredText.vue'

defineProps({
  article: {
    type: Object,
    required: true
  },
  isSmallScreen: {
    type: Boolean,
    default: false
  }
})

const configStore = useConfigStore()
const categoryPageEnabled = computed(() => Boolean(configStore.pageRegistry?.categories))
const tagPageEnabled = computed(() => Boolean(configStore.pageRegistry?.tags))
const { elementRef: textBlockRef, width: textBlockWidth } = useElementWidth()
const coverListConfig = computed(() => {
  const list = configStore.coverConfig?.list || {}

  return {
    showCover: list.showCover !== false,
    aspectRatio: String(list.aspectRatio || '').trim(),
    objectFit: String(list.objectFit || 'cover').trim() || 'cover',
    placeholder: ['none', 'gradient', 'icon'].includes(String(list.placeholder || '').trim())
      ? String(list.placeholder || '').trim()
      : 'gradient'
  }
})
const showCoverPlaceholder = computed(() => (
  coverListConfig.value.showCover && coverListConfig.value.placeholder !== 'none'
))

const getArticleCover = (article) => resolveDisplayArticleCover(article, {
  coverConfig: configStore.coverConfig,
  style: configStore.coverStyle
})
const hasArticleCover = (article) => Boolean(getArticleCover(article))
const showArticleCover = (article) => coverListConfig.value.showCover && hasArticleCover(article)

const getArticleBackgroundStyle = (article) => (
  showArticleCover(article)
    ? {
      backgroundImage: `url('${getArticleCover(article)}')`,
      backgroundSize: coverListConfig.value.objectFit === 'contain' ? 'contain' : 'cover'
    }
    : {}
)

const getArticleCardStyle = (article) => ({
  ...getArticleBackgroundStyle(article),
  ...(coverListConfig.value.aspectRatio
    ? {
      aspectRatio: coverListConfig.value.aspectRatio,
      height: 'auto'
    }
    : {})
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const formatShortDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
</script>
