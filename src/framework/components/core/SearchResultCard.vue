<template>
  <div class="theme-list-card search-result-card p-6 rounded-lg transition-shadow">
    <div ref="contentRef" class="flex flex-col">
      <component
        :is="resultRoute ? 'router-link' : 'span'"
        :to="resultRoute || undefined"
        class="theme-list-title-link text-xl leading-[1.32] font-bold mb-2 block"
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
        class="theme-list-excerpt mb-4 leading-relaxed"
        :text="articleSnippet"
        :keywords="keywords"
        :lines="3"
        :available-width="contentWidth"
      />

      <div class="theme-inline-meta flex flex-wrap text-sm">
        <div class="mr-4" v-if="article.sectionTitle">
          <component
            :is="article.sectionPath ? 'router-link' : 'span'"
            :to="article.sectionPath || undefined"
            class="theme-inline-link"
          >
            {{ article.sectionTitle }}
          </component>
        </div>

        <div class="mr-4" v-if="article.createdAt">
          <span>{{ formatDate(article.createdAt) }}</span>
        </div>

        <div class="mr-4" v-if="article.category">
          <component
            :is="showTaxonomyLinks ? 'router-link' : 'span'"
            :to="showTaxonomyLinks ? getCategoryRoute(article.category) : undefined"
            class="theme-inline-link"
          >
            {{ typeof article.category === 'string' ? article.category : article.category.name }}
          </component>
        </div>

        <div class="flex flex-wrap gap-1" v-if="article.tags && article.tags.length > 0">
          <component
            v-for="tag in article.tags"
            :key="typeof tag === 'string' ? tag : tag.id"
            :is="showTaxonomyLinks ? 'router-link' : 'span'"
            :to="showTaxonomyLinks ? getTagRoute(tag) : undefined"
            class="theme-inline-link"
          >
            #{{ typeof tag === 'string' ? tag : tag.name }}
          </component>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useElementWidth } from '../../composables/useElementWidth'
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

const { elementRef: contentRef, width: contentWidth } = useElementWidth()
const resultRoute = computed(() => {
  if (props.article?.to) {
    return props.article.to
  }

  if (props.article?.kind === 'article') {
    return getArticleRoute(props.article)
  }

  return ''
})
const showTaxonomyLinks = computed(() => (
  Boolean(props.article?.category)
  || (Array.isArray(props.article?.tags) && props.article.tags.length > 0)
))

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
  if (!dateString) return '未知日期'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '未知日期'

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
