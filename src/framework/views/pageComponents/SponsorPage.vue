<template>
  <div class="sponsor-page">
    <div v-if="contentBlocks.length > 0" class="sponsor-page-intro theme-list-card rounded-2xl p-5 sm:p-6">
      <p
        v-for="block in contentBlocks"
        :key="block"
        class="sponsor-page-intro-copy"
      >
        {{ block }}
      </p>
    </div>

    <section
      v-if="sponsorConfig.pageEnabled"
      class="sponsor-page-hero theme-list-card rounded-2xl p-5 sm:p-6"
    >
      <div class="sponsor-page-hero-copy">
        <p class="sponsor-page-kicker">{{ sponsorConfig.pageKicker }}</p>
        <h2 class="sponsor-page-title">{{ sponsorConfig.pageTitle }}</h2>
        <p v-if="sponsorConfig.pageDescription" class="sponsor-page-description">
          {{ sponsorConfig.pageDescription }}
        </p>
      </div>

      <div class="sponsor-page-action-panel">
        <RouterLink
          v-if="sponsorConfig.buttonUrl && !sponsorConfig.buttonExternal"
          :to="sponsorConfig.buttonUrl"
          class="sponsor-page-button"
        >
          {{ sponsorButtonText }}
        </RouterLink>
        <a
          v-else-if="sponsorConfig.buttonUrl"
          :href="sponsorConfig.buttonUrl"
          target="_blank"
          rel="noreferrer"
          class="sponsor-page-button"
        >
          {{ sponsorButtonText }}
        </a>
        <p v-if="sponsorConfig.buttonNote" class="sponsor-page-note">
          {{ sponsorConfig.buttonNote }}
        </p>
      </div>
    </section>

    <section v-if="sponsorMethods.length > 0" class="sponsor-page-methods">
      <component
        :is="resolveMethodComponent(method)"
        v-for="method in sponsorMethods"
        :key="method.id"
        v-bind="resolveMethodProps(method)"
        class="sponsor-page-method-card theme-grid-card"
      >
        <div v-if="method.resolvedImageUrl" class="sponsor-page-method-image-shell">
          <img
            :src="method.resolvedImageUrl"
            :alt="`${method.name} 二维码`"
            class="sponsor-page-method-image"
            loading="lazy"
          />
        </div>
        <div class="sponsor-page-method-copy">
          <h3 class="sponsor-page-method-title">{{ method.name }}</h3>
          <p v-if="method.accountName" class="sponsor-page-method-account">{{ method.accountName }}</p>
          <p v-if="method.note" class="sponsor-page-method-note">{{ method.note }}</p>
        </div>
      </component>
    </section>

    <section
      v-if="supporters.length > 0"
      class="sponsor-page-supporters theme-list-card rounded-2xl p-5 sm:p-6"
    >
      <div class="sponsor-page-supporters-head">
        <h2 class="sponsor-page-section-title">{{ sponsorConfig.supportersTitle }}</h2>
        <p v-if="sponsorConfig.supportersDescription" class="sponsor-page-description">
          {{ sponsorConfig.supportersDescription }}
        </p>
      </div>

      <div class="sponsor-page-supporter-grid">
        <component
          :is="supporter.url ? 'a' : 'article'"
          v-for="supporter in supporters"
          :key="supporter.id"
          :href="supporter.url || undefined"
          :target="supporter.external ? '_blank' : undefined"
          :rel="supporter.external ? 'noreferrer' : undefined"
          class="sponsor-page-supporter"
        >
          <div class="sponsor-page-supporter-avatar">
            <img
              v-if="supporter.resolvedAvatarUrl"
              :src="supporter.resolvedAvatarUrl"
              :alt="`${supporter.name} avatar`"
              class="sponsor-page-supporter-image"
              loading="lazy"
            />
            <span v-else class="sponsor-page-supporter-fallback">{{ getAvatarFallback(supporter.name) }}</span>
          </div>

          <div class="sponsor-page-supporter-copy">
            <h3 class="sponsor-page-supporter-name">{{ supporter.name }}</h3>
            <p v-if="getSupporterMeta(supporter)" class="sponsor-page-supporter-meta">
              {{ getSupporterMeta(supporter) }}
            </p>
            <p v-if="supporter.description" class="sponsor-page-supporter-description">
              {{ supporter.description }}
            </p>
          </div>
        </component>
      </div>
    </section>

    <div
      v-if="!sponsorConfig.pageEnabled && sponsorMethods.length === 0 && supporters.length === 0"
      class="theme-empty-state py-8 text-center"
    >
      <p class="theme-empty-text">赞助页尚未启用。</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useConfigStore } from '../../stores/config'

defineProps({
  page: {
    type: Object,
    required: true
  },
  contentBlocks: {
    type: Array,
    default: () => []
  }
})

const configStore = useConfigStore()

const sponsorConfig = computed(() => (
  configStore.sponsorConfig || {
    pageEnabled: false,
    pageKicker: '赞助',
    pageTitle: '支持作者',
    pageDescription: '',
    buttonText: '',
    buttonUrl: '',
    buttonExternal: false,
    buttonNote: '',
    supportersTitle: '赞助者',
    supportersDescription: '',
    methods: [],
    supporters: []
  }
))

const sponsorButtonText = computed(() => (
  sponsorConfig.value.buttonText || '前往支持'
))

const sponsorMethods = computed(() => (
  Array.isArray(sponsorConfig.value.methods)
    ? sponsorConfig.value.methods.map((method) => ({
      ...method,
      resolvedImageUrl: resolveAssetUrl(method.imageUrl)
    }))
    : []
))

const supporters = computed(() => (
  Array.isArray(sponsorConfig.value.supporters)
    ? sponsorConfig.value.supporters.map((supporter) => ({
      ...supporter,
      resolvedAvatarUrl: resolveAssetUrl(supporter.avatarUrl)
    }))
    : []
))

function resolveAssetUrl(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(normalizedValue) || normalizedValue.startsWith('data:')) {
    return normalizedValue
  }

  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedPath = normalizedValue.replace(/^\.?\//, '').replace(/^\/+/, '')
  return `${baseUrl}${normalizedPath}`.replace(/(?<!:)\/{2,}/g, '/')
}

function resolveMethodComponent(method) {
  if (method.linkUrl && !method.external) {
    return RouterLink
  }

  return method.linkUrl ? 'a' : 'article'
}

function resolveMethodProps(method) {
  if (method.linkUrl && !method.external) {
    return {
      to: method.linkUrl
    }
  }

  if (method.linkUrl) {
    return {
      href: method.linkUrl,
      target: '_blank',
      rel: 'noreferrer'
    }
  }

  return {}
}

function getAvatarFallback(name) {
  return String(name || '?').trim().charAt(0).toUpperCase()
}

function getSupporterMeta(supporter) {
  return [supporter.tier, supporter.amount, supporter.date].filter(Boolean).join(' · ')
}
</script>

<style scoped>
.sponsor-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.sponsor-page-intro {
  display: grid;
  gap: 0.9rem;
}

.sponsor-page-intro-copy,
.sponsor-page-description,
.sponsor-page-note {
  margin: 0;
  color: rgb(71 85 105);
  line-height: 1.85;
  overflow-wrap: anywhere;
}

.sponsor-page-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(16rem, 0.65fr);
  gap: 1.1rem;
  align-items: stretch;
}

.sponsor-page-hero-copy,
.sponsor-page-action-panel,
.sponsor-page-supporters-head,
.sponsor-page-method-copy,
.sponsor-page-supporter-copy {
  display: grid;
  gap: 0.65rem;
}

.sponsor-page-kicker {
  margin: 0;
  color: rgb(148 163 184);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.sponsor-page-title {
  margin: 0;
  color: rgb(15 23 42);
  font-size: clamp(1.45rem, 3vw, 2.15rem);
  line-height: 1.2;
  letter-spacing: -0.035em;
}

.sponsor-page-section-title {
  margin: 0;
  color: rgb(15 23 42);
  font-size: 1.18rem;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.sponsor-page-action-panel {
  align-content: center;
  padding: 1rem;
  border-radius: 1.25rem;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.9));
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.sponsor-page-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.85rem;
  width: fit-content;
  padding: 0.75rem 1.18rem;
  border-radius: 9999px;
  background: rgb(15 23 42);
  color: white;
  text-decoration: none;
  font-weight: 700;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.16);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.sponsor-page-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 20px 34px rgba(15, 23, 42, 0.2);
}

.sponsor-page-methods,
.sponsor-page-supporter-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
}

.sponsor-page-method-card {
  display: grid;
  gap: 0.9rem;
  text-align: center;
  text-decoration: none;
  color: inherit;
}

.sponsor-page-method-image-shell {
  width: 100%;
  max-width: 11rem;
  aspect-ratio: 1 / 1;
  justify-self: center;
  overflow: hidden;
  border-radius: 1rem;
  background: white;
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.sponsor-page-method-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sponsor-page-method-title,
.sponsor-page-supporter-name {
  margin: 0;
  color: rgb(15 23 42);
  font-size: 1rem;
  line-height: 1.35;
}

.sponsor-page-method-account,
.sponsor-page-supporter-meta {
  margin: 0;
  color: rgb(51 65 85);
  font-size: 0.9rem;
  line-height: 1.65;
}

.sponsor-page-method-note,
.sponsor-page-supporter-description {
  margin: 0;
  color: rgb(100 116 139);
  font-size: 0.84rem;
  line-height: 1.7;
}

.sponsor-page-supporters {
  display: grid;
  gap: 1rem;
}

.sponsor-page-supporter {
  display: flex;
  gap: 0.85rem;
  min-width: 0;
  padding: 0.95rem;
  border-radius: 1.15rem;
  border: 1px solid rgba(226, 232, 240, 0.96);
  background: rgba(255, 255, 255, 0.82);
  color: inherit;
  text-decoration: none;
}

.sponsor-page-supporter-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 9999px;
  background: rgba(219, 234, 254, 0.75);
  border: 1px solid rgba(191, 219, 254, 0.95);
}

.sponsor-page-supporter-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sponsor-page-supporter-fallback {
  color: rgb(37 99 235);
  font-weight: 800;
}

@media (max-width: 720px) {
  .sponsor-page-hero {
    grid-template-columns: 1fr;
  }

  .sponsor-page-methods,
  .sponsor-page-supporter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
