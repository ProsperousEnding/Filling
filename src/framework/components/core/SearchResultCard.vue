<template>
  <article
    class="theme-list-card search-result-card rounded-2xl transition-shadow"
    :class="{ 'search-result-card-without-cover': !hasCover && !showCoverPlaceholder }"
  >
    <component
      v-if="hasCover"
      :is="resultTag"
      v-bind="resultLinkAttrs"
      class="search-result-cover"
      :aria-label="article.title"
    >
      <img
        :src="displayCover"
        :alt="article.title"
        class="search-result-cover-image"
        :loading="coverListConfig.loading"
        :style="coverImageStyle"
        @error="coverLoadFailed = true"
      />
    </component>

    <component
      v-else-if="showCoverPlaceholder"
      :is="resultTag"
      v-bind="resultLinkAttrs"
      class="search-result-cover search-result-cover-placeholder"
      :data-placeholder="coverListConfig.placeholder"
      :aria-label="article.title"
    >
      <ImageIcon v-if="coverListConfig.placeholder === 'icon'" aria-hidden="true" />
    </component>

    <div ref="contentRef" class="search-result-body">
      <div class="search-result-kicker">
        <span class="search-result-kind">{{ resultKindLabel }}</span>
        <span v-if="formattedDate" class="search-result-dot" aria-hidden="true"></span>
        <span v-if="formattedDate">{{ formattedDate }}</span>
      </div>

      <component
        :is="resultTag"
        v-bind="resultLinkAttrs"
        class="theme-list-title-link search-result-title"
      >
        <MeasuredText
          tag="span"
          class="block"
          :text="article.title"
          :lines="2"
          :available-width="contentWidth"
        />
      </component>

      <MeasuredHighlightedText
        tag="p"
        class="theme-list-excerpt search-result-excerpt"
        :text="articleSnippet"
        :keywords="keywords"
        :lines="3"
        :available-width="contentWidth"
      />

      <div class="search-result-meta">
        <component
          v-if="article.sectionTitle"
          :is="article.sectionPath ? 'router-link' : 'span'"
          :to="article.sectionPath || undefined"
          class="theme-inline-link search-result-chip"
        >
          {{ article.sectionTitle }}
        </component>

        <component
          v-if="article.category"
          :is="showTaxonomyLinks ? 'router-link' : 'span'"
          :to="showTaxonomyLinks ? getCategoryRoute(article.category) : undefined"
          class="theme-inline-link search-result-chip"
        >
          {{ getCategoryLabel(article.category) }}
        </component>

        <component
          v-for="tag in visibleTags"
          :key="getTagKey(tag)"
          :is="showTagLinks ? 'router-link' : 'span'"
          :to="showTagLinks ? getTagRoute(tag) : undefined"
          class="theme-inline-link search-result-chip"
        >
          #{{ getTagLabel(tag) }}
        </component>

        <span v-if="remainingTagCount > 0" class="search-result-chip search-result-chip-muted">
          +{{ remainingTagCount }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { Image as ImageIcon } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useElementWidth } from '../../composables/useElementWidth'
import { useConfigStore } from '../../stores/config'
import { resolveDisplayArticleCover } from '../../utils/articleCover'
import { getArticleRoute, getCategoryRoute, getTagRoute } from '../../utils/routeLinks'
import MeasuredHighlightedText from './MeasuredHighlightedText.vue'
import MeasuredText from './MeasuredText.vue'

const props = defineProps({
  article: {
    type: Object,
    required: true
  },
  keywords: {
    type: Array,
    default: () => []
  }
})

const configStore = useConfigStore()
const coverLoadFailed = ref(false)
const { elementRef: contentRef, width: contentWidth } = useElementWidth()
const coverListConfig = computed(() => {
  const list = configStore.coverConfig?.list || {}

  return {
    showCover: list.showCover !== false,
    loading: list.loading === 'eager' ? 'eager' : 'lazy',
    objectFit: String(list.objectFit || 'cover').trim() || 'cover',
    placeholder: ['none', 'gradient', 'icon'].includes(String(list.placeholder || '').trim())
      ? String(list.placeholder || '').trim()
      : 'gradient'
  }
})
const resultRoute = computed(() => {
  if (props.article?.to) {
    return props.article.to
  }

  if (props.article?.kind === 'article') {
    return getArticleRoute(props.article)
  }

  return ''
})
const resultHref = computed(() => String(props.article?.href || '').trim())
const resultTag = computed(() => {
  if (resultHref.value) return 'a'
  if (resultRoute.value) return 'router-link'
  return 'span'
})
const resultLinkAttrs = computed(() => {
  if (resultHref.value) {
    return {
      href: resultHref.value,
      target: props.article?.external === false ? undefined : '_blank',
      rel: props.article?.external === false ? undefined : 'noreferrer'
    }
  }

  if (resultRoute.value) {
    return {
      to: resultRoute.value
    }
  }

  return {}
})
const showTaxonomyLinks = computed(() => (
  Boolean(props.article?.category) && Boolean(configStore.pageRegistry?.categories)
))
const showTagLinks = computed(() => (
  Array.isArray(props.article?.tags)
  && props.article.tags.length > 0
  && Boolean(configStore.pageRegistry?.tags)
))
const resultKindLabel = computed(() => {
  const kind = String(props.article?.kind || '').trim().toLowerCase()

  if (kind === 'article') return '文章'
  if (kind === 'page') return '页面'
  if (kind === 'note') return '笔记'
  return '内容'
})
const displayCover = computed(() => {
  if (!coverListConfig.value.showCover) {
    return ''
  }

  return resolveDisplayArticleCover(props.article, {
    coverConfig: configStore.coverConfig,
    style: configStore.coverConfig?.seededStyle
  })
})
watch(displayCover, () => {
  coverLoadFailed.value = false
})

const hasCover = computed(() => Boolean(displayCover.value) && !coverLoadFailed.value)
const showCoverPlaceholder = computed(() => (
  coverListConfig.value.showCover
  && !hasCover.value
  && coverListConfig.value.placeholder !== 'none'
))
const coverImageStyle = computed(() => ({
  objectFit: coverListConfig.value.objectFit
}))
const formattedDate = computed(() => formatDate(props.article?.createdAt || props.article?.date))
const visibleTags = computed(() => (
  Array.isArray(props.article?.tags) ? props.article.tags.slice(0, 3) : []
))
const remainingTagCount = computed(() => Math.max(0, (props.article?.tags?.length || 0) - visibleTags.value.length))

const articleSnippet = computed(() => {
  const candidates = [props.article?.excerpt, props.article?.plainText, props.article?.description, props.article?.title]
    .map(text => String(text || '').trim())
    .filter(Boolean)

  if (candidates.length === 0) {
    return ''
  }

  const loweredKeywords = (Array.isArray(props.keywords) ? props.keywords : [])
    .map(keyword => String(keyword || '').trim().toLowerCase())
    .filter(Boolean)
  const matchedCandidate = candidates.find(text => loweredKeywords.some(keyword => text.toLowerCase().includes(keyword)))

  return matchedCandidate || candidates[0]
})

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getCategoryLabel(category) {
  return typeof category === 'string' ? category : category?.name || category?.label || ''
}

function getTagLabel(tag) {
  return typeof tag === 'string' ? tag : tag?.name || tag?.label || ''
}

function getTagKey(tag) {
  return typeof tag === 'string' ? tag : tag?.id || tag?.name || tag?.label
}
</script>

<style scoped>
.search-result-card {
  display: grid;
  grid-template-columns: minmax(9rem, 0.36fr) minmax(0, 1fr);
  gap: 1rem;
  overflow: hidden;
  padding: 0.75rem;
}

.search-result-cover {
  position: relative;
  min-height: 10.5rem;
  overflow: hidden;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.82), rgba(248, 250, 252, 0.96));
}

.search-result-cover-image {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
}

.search-result-cover-placeholder {
  display: grid;
  place-items: center;
  color: rgb(37 99 235);
}

.search-result-cover-placeholder[data-placeholder='icon'] {
  color: rgb(148 163 184);
  background: rgba(248, 250, 252, 0.96);
}

.search-result-cover-placeholder svg {
  width: 2.5rem;
  height: 2.5rem;
}

.search-result-card-without-cover {
  grid-template-columns: minmax(0, 1fr);
}

.search-result-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding: 0.45rem 0.65rem 0.45rem 0;
}

.search-result-kicker,
.search-result-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}

.search-result-kicker {
  margin-bottom: 0.55rem;
  color: var(--theme-text-muted, rgb(100 116 139));
  font-size: 0.78rem;
  font-weight: 650;
}

.search-result-kind,
.search-result-chip {
  display: inline-flex;
  align-items: center;
  min-height: 1.45rem;
  border: 1px solid rgba(226, 232, 240, 0.78);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.82);
  padding: 0 0.55rem;
  line-height: 1;
}

.search-result-kind {
  color: rgb(37 99 235);
}

.search-result-dot {
  width: 0.24rem;
  height: 0.24rem;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.42;
}

.search-result-title {
  display: block;
  margin-bottom: 0.55rem;
  font-size: clamp(1.05rem, 2vw, 1.28rem);
  font-weight: 760;
  line-height: 1.32;
}

.search-result-excerpt {
  margin-bottom: 0.9rem;
  line-height: 1.72;
}

.search-result-meta {
  font-size: 0.82rem;
}

.search-result-chip {
  color: var(--theme-text-muted, rgb(100 116 139));
  text-decoration: none;
}

.search-result-chip-muted {
  color: rgb(148 163 184);
}

:global(.dark .search-result-cover) {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96));
}

:global(.dark .search-result-kind),
:global(.dark .search-result-chip) {
  border-color: rgba(71, 85, 105, 0.72);
  background: rgba(15, 23, 42, 0.42);
}

:global(.dark .search-result-kind) {
  color: rgb(147 197 253);
}

@media (max-width: 640px) {
  .search-result-card {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.85rem;
    padding: 0.65rem;
    border-radius: 1.25rem;
  }

  .search-result-cover {
    min-height: 9.5rem;
    border-radius: 0.9rem;
  }

  .search-result-body {
    padding: 0.2rem 0.15rem 0.35rem;
  }

  .search-result-title {
    font-size: 1.05rem;
  }

  .search-result-excerpt {
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
  }
}
</style>
