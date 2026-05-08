<template>
  <section
    v-if="sponsorConfig.enabled"
    class="article-sponsor-section mb-12 rounded-[1.75rem] border border-slate-200/80 bg-white/95 px-6 py-5 shadow-sm"
  >
    <div class="article-sponsor-header">
      <p class="article-sponsor-kicker">赞助</p>
      <h2 class="article-sponsor-title">{{ sponsorConfig.title }}</h2>
      <p v-if="sponsorConfig.description" class="article-sponsor-description">
        {{ sponsorConfig.description }}
      </p>
    </div>

    <div class="article-sponsor-layout" :class="{ 'has-methods': sponsorMethods.length > 0 }">
      <div v-if="showPrimaryAction" class="article-sponsor-primary">
        <RouterLink
          v-if="sponsorConfig.buttonUrl && !sponsorConfig.buttonExternal"
          :to="sponsorConfig.buttonUrl"
          class="article-sponsor-button"
        >
          {{ sponsorButtonText }}
        </RouterLink>
        <a
          v-else-if="sponsorConfig.buttonUrl"
          :href="sponsorConfig.buttonUrl"
          target="_blank"
          rel="noreferrer"
          class="article-sponsor-button"
        >
          {{ sponsorButtonText }}
        </a>
        <p v-if="sponsorConfig.buttonNote" class="article-sponsor-note">
          {{ sponsorConfig.buttonNote }}
        </p>
      </div>

      <div v-if="sponsorMethods.length > 0" class="article-sponsor-methods">
        <component
          :is="resolveMethodComponent(method)"
          v-for="method in sponsorMethods"
          :key="method.id"
          v-bind="resolveMethodProps(method)"
          class="article-sponsor-method"
        >
          <div v-if="method.resolvedImageUrl" class="article-sponsor-method-image-shell">
            <img
              :src="method.resolvedImageUrl"
              :alt="`${method.name} 二维码`"
              class="article-sponsor-method-image"
              loading="lazy"
            />
          </div>
          <h3 class="article-sponsor-method-title">{{ method.name }}</h3>
          <p v-if="method.accountName" class="article-sponsor-method-account">{{ method.accountName }}</p>
          <p v-if="method.note" class="article-sponsor-method-note">{{ method.note }}</p>
        </component>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useConfigStore } from '../../stores/config'

const configStore = useConfigStore()

const sponsorConfig = computed(() => (
  configStore.sponsorConfig || {
    enabled: false,
    title: '支持作者',
    description: '',
    buttonText: '',
    buttonUrl: '',
    buttonExternal: false,
    buttonNote: '',
    methods: []
  }
))

const sponsorButtonText = computed(() => (
  sponsorConfig.value.buttonText || '前往支持'
))

const showPrimaryAction = computed(() => (
  Boolean(sponsorConfig.value.buttonUrl || sponsorConfig.value.buttonNote)
))

const sponsorMethods = computed(() => (
  Array.isArray(sponsorConfig.value.methods)
    ? sponsorConfig.value.methods.map((method) => ({
      ...method,
      resolvedImageUrl: resolveAssetUrl(method.imageUrl)
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

  return method.linkUrl ? 'a' : 'div'
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
</script>

<style scoped>
.article-sponsor-header {
  margin-bottom: 1.1rem;
}

.article-sponsor-kicker {
  margin: 0 0 0.5rem;
  color: rgb(148 163 184);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.article-sponsor-title {
  margin: 0;
  color: rgb(15 23 42);
  font-size: 1.35rem;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.article-sponsor-description {
  margin: 0.8rem 0 0;
  color: rgb(100 116 139);
  line-height: 1.75;
}

.article-sponsor-layout {
  display: grid;
  gap: 1rem;
}

.article-sponsor-layout.has-methods {
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.3fr);
}

.article-sponsor-primary {
  display: grid;
  align-content: start;
  gap: 0.85rem;
  padding: 1rem 1.05rem;
  border-radius: 1.3rem;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.88));
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.article-sponsor-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.8rem;
  width: fit-content;
  padding: 0.75rem 1.15rem;
  border-radius: 9999px;
  background: rgb(15 23 42);
  color: white;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
}

.article-sponsor-button:hover {
  transform: translateY(-1px);
}

.article-sponsor-note {
  margin: 0;
  color: rgb(100 116 139);
  line-height: 1.7;
}

.article-sponsor-methods {
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.article-sponsor-method {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  padding: 1rem;
  border-radius: 1.35rem;
  border: 1px solid rgba(226, 232, 240, 0.96);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  text-align: center;
  text-decoration: none;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.article-sponsor-method:hover {
  transform: translateY(-2px);
  border-color: rgba(148, 163, 184, 0.5);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
}

.article-sponsor-method-image-shell {
  width: 100%;
  max-width: 9.5rem;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 1rem;
  background: white;
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.article-sponsor-method-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-sponsor-method-title {
  margin: 0;
  color: rgb(15 23 42);
  font-size: 1rem;
  line-height: 1.35;
}

.article-sponsor-method-account {
  margin: 0;
  color: rgb(51 65 85);
  font-size: 0.92rem;
  line-height: 1.6;
}

.article-sponsor-method-note {
  margin: 0;
  color: rgb(100 116 139);
  font-size: 0.84rem;
  line-height: 1.65;
}

@media (max-width: 900px) {
  .article-sponsor-layout.has-methods {
    grid-template-columns: 1fr;
  }
}
</style>
