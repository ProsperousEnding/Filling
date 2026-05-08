<template>
  <section
    v-if="commentConfig.enabled"
    class="article-comment-section mb-12 rounded-[1.75rem] border border-slate-200/80 bg-white/95 px-6 py-5 shadow-sm"
  >
    <div class="mb-5">
      <p class="article-comment-kicker">评论</p>
      <h2 class="article-comment-title">{{ commentConfig.title }}</h2>
      <p v-if="commentConfig.description" class="article-comment-description">
        {{ commentConfig.description }}
      </p>
    </div>

    <div
      v-if="!commentConfig.ready"
      class="rounded-2xl border border-dashed border-slate-300 bg-slate-50/85 px-4 py-5 text-sm leading-7 text-slate-500"
    >
      {{ commentConfig.notReadyText }}
    </div>

    <div v-else ref="containerRef" class="article-comment-embed min-h-[160px]"></div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useConfigStore } from '../../stores/config'

const GISCUS_ORIGIN = 'https://giscus.app'
const GISCUS_SCRIPT_SRC = `${GISCUS_ORIGIN}/client.js`
const UTTERANCES_SCRIPT_SRC = 'https://utteranc.es/client.js'

const props = defineProps({
  article: {
    type: Object,
    default: () => null
  }
})

const route = useRoute()
const configStore = useConfigStore()
const containerRef = ref(null)

const commentConfig = computed(() => (
  configStore.commentConfig || {
    enabled: false,
    ready: false,
    title: '评论',
    description: '',
    notReadyText: '评论系统尚未完成配置。',
    giscus: {},
    utterances: {}
  }
))

const giscusConfig = computed(() => (
  commentConfig.value?.giscus || {}
))

const utterancesConfig = computed(() => (
  commentConfig.value?.utterances || {}
))

const resolvedTheme = computed(() => (
  commentConfig.value.provider === 'utterances'
    ? (
      configStore.theme === 'dark'
        ? String(utterancesConfig.value.darkTheme || utterancesConfig.value.theme || 'github-dark').trim()
        : String(utterancesConfig.value.theme || 'github-light').trim()
    )
    : (
      configStore.theme === 'dark'
        ? String(giscusConfig.value.darkTheme || giscusConfig.value.theme || 'dark_dimmed').trim()
        : String(giscusConfig.value.theme || 'light').trim()
    )
))

const embedSignature = computed(() => JSON.stringify({
  enabled: commentConfig.value.enabled,
  ready: commentConfig.value.ready,
  provider: commentConfig.value.provider,
  path: route.fullPath,
  articleKey: String(
    props.article?.id
    || props.article?.slug
    || props.article?.title
    || ''
  ).trim(),
  theme: commentConfig.value.provider === 'utterances' ? resolvedTheme.value : '',
  repo: giscusConfig.value.repo,
  repoId: giscusConfig.value.repoId,
  category: giscusConfig.value.category,
  categoryId: giscusConfig.value.categoryId,
  mapping: giscusConfig.value.mapping,
  term: giscusConfig.value.term,
  strict: giscusConfig.value.strict,
  reactionsEnabled: giscusConfig.value.reactionsEnabled,
  emitMetadata: giscusConfig.value.emitMetadata,
  inputPosition: giscusConfig.value.inputPosition,
  lang: giscusConfig.value.lang,
  loading: giscusConfig.value.loading,
  utterancesRepo: utterancesConfig.value.repo,
  utterancesIssueTerm: utterancesConfig.value.issueTerm,
  utterancesIssueNumber: utterancesConfig.value.issueNumber,
  utterancesLabel: utterancesConfig.value.label,
  utterancesCrossorigin: utterancesConfig.value.crossorigin
}))

watch(embedSignature, async () => {
  await nextTick()
  renderEmbed()
}, { immediate: true })

watch(resolvedTheme, (nextTheme) => {
  updateTheme(nextTheme)
})

onBeforeUnmount(() => {
  clearEmbed()
})

function clearEmbed() {
  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }
}

function setScriptAttribute(script, key, value) {
  const normalizedValue = String(value || '').trim()

  if (normalizedValue) {
    script.setAttribute(`data-${key}`, normalizedValue)
  }
}

function renderEmbed() {
  clearEmbed()

  if (
    typeof window === 'undefined'
    || !containerRef.value
    || !commentConfig.value.enabled
    || !commentConfig.value.ready
  ) {
    return
  }

  if (commentConfig.value.provider === 'utterances') {
    renderUtterancesEmbed()
    return
  }

  renderGiscusEmbed()
}

function renderGiscusEmbed() {
  const script = document.createElement('script')
  script.src = GISCUS_SCRIPT_SRC
  script.async = true
  script.crossOrigin = 'anonymous'

  setScriptAttribute(script, 'repo', giscusConfig.value.repo)
  setScriptAttribute(script, 'repo-id', giscusConfig.value.repoId)
  setScriptAttribute(script, 'category', giscusConfig.value.category)
  setScriptAttribute(script, 'category-id', giscusConfig.value.categoryId)
  setScriptAttribute(script, 'mapping', giscusConfig.value.mapping)
  setScriptAttribute(script, 'term', giscusConfig.value.term)
  setScriptAttribute(script, 'strict', giscusConfig.value.strict ? '1' : '0')
  setScriptAttribute(script, 'reactions-enabled', giscusConfig.value.reactionsEnabled ? '1' : '0')
  setScriptAttribute(script, 'emit-metadata', giscusConfig.value.emitMetadata ? '1' : '0')
  setScriptAttribute(script, 'input-position', giscusConfig.value.inputPosition)
  setScriptAttribute(script, 'lang', giscusConfig.value.lang)
  setScriptAttribute(script, 'loading', giscusConfig.value.loading)
  setScriptAttribute(script, 'theme', resolvedTheme.value)

  containerRef.value.appendChild(script)
}

function renderUtterancesEmbed() {
  const script = document.createElement('script')
  script.src = UTTERANCES_SCRIPT_SRC
  script.async = true
  script.crossOrigin = utterancesConfig.value.crossorigin || 'anonymous'
  script.setAttribute('repo', utterancesConfig.value.repo)

  if (utterancesConfig.value.issueNumber) {
    script.setAttribute('issue-number', utterancesConfig.value.issueNumber)
  } else {
    script.setAttribute('issue-term', utterancesConfig.value.issueTerm || 'pathname')
  }

  if (utterancesConfig.value.label) {
    script.setAttribute('label', utterancesConfig.value.label)
  }

  script.setAttribute('theme', resolvedTheme.value)
  containerRef.value.appendChild(script)
}

function updateTheme(theme) {
  if (
    typeof window === 'undefined'
    || !commentConfig.value.enabled
    || !commentConfig.value.ready
    || commentConfig.value.provider !== 'giscus'
  ) {
    return
  }

  const iframe = containerRef.value?.querySelector('iframe.giscus-frame')

  if (!iframe?.contentWindow) {
    return
  }

  iframe.contentWindow.postMessage({
    giscus: {
      setConfig: {
        theme
      }
    }
  }, GISCUS_ORIGIN)
}
</script>

<style scoped>
.article-comment-kicker {
  margin: 0 0 0.5rem;
  color: rgb(148 163 184);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.article-comment-title {
  margin: 0;
  color: rgb(15 23 42);
  font-size: 1.35rem;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.article-comment-description {
  margin: 0.8rem 0 0;
  color: rgb(100 116 139);
  line-height: 1.75;
}

.article-comment-embed:deep(.giscus),
.article-comment-embed:deep(.giscus-frame),
.article-comment-embed:deep(.utterances),
.article-comment-embed:deep(.utterances-frame) {
  width: 100%;
  max-width: 100%;
}
</style>
