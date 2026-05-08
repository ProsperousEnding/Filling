<template>
  <div class="friend-links-page">
    <div v-if="contentBlocks.length > 0" class="friend-links-intro theme-list-card rounded-2xl p-5 sm:p-6">
      <p
        v-for="block in contentBlocks"
        :key="block"
        class="friend-links-intro-copy"
      >
        {{ block }}
      </p>
    </div>

    <div v-if="friendLinks.length === 0" class="theme-empty-state py-8 text-center">
      <p class="theme-empty-text">{{ page.emptyText || '还没有配置友情链接。' }}</p>
    </div>

    <div v-else class="friend-links-grid">
      <a
        v-for="link in friendLinks"
        :key="link.id"
        :href="link.url"
        target="_blank"
        rel="noreferrer"
        class="friend-link-card theme-grid-card"
      >
        <div class="friend-link-card-head">
          <div class="friend-link-avatar-shell">
            <img
              v-if="link.avatarUrl"
              :src="link.avatarUrl"
              :alt="`${link.name} logo`"
              class="friend-link-avatar"
              loading="lazy"
            />
            <span v-else class="friend-link-avatar-fallback">{{ getAvatarFallback(link.name) }}</span>
          </div>

          <div class="friend-link-heading">
            <h2 class="friend-link-title">{{ link.name }}</h2>
            <p class="friend-link-host">{{ link.hostname }}</p>
          </div>
        </div>

        <p v-if="link.description" class="friend-link-description">
          {{ link.description }}
        </p>

        <div v-if="link.tags.length > 0" class="friend-link-tags">
          <span
            v-for="tag in link.tags"
            :key="`${link.id}-${tag}`"
            class="friend-link-tag"
          >
            {{ tag }}
          </span>
        </div>

        <ul v-if="link.details.length > 0" class="friend-link-details">
          <li
            v-for="detail in link.details"
            :key="`${link.id}-${detail}`"
            class="theme-inline-meta text-sm"
          >
            {{ detail }}
          </li>
        </ul>

        <div class="friend-link-action-row">
          <span class="friend-link-action">访问站点</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="friend-link-action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </a>
    </div>

    <section
      v-if="application.enabled"
      class="friend-links-application theme-list-card rounded-2xl p-5 sm:p-6"
    >
      <div class="friend-links-application-head">
        <p class="friend-links-application-kicker">交换友链</p>
        <h2 class="friend-links-application-title">
          {{ application.title || '申请交换友链' }}
        </h2>
        <p v-if="application.description" class="friend-links-application-description">
          {{ application.description }}
        </p>
      </div>

      <div
        v-if="application.requirements.length > 0 || application.submissionFields.length > 0"
        class="friend-links-application-grid"
      >
        <div
          v-if="application.requirements.length > 0"
          class="friend-links-application-panel"
        >
          <h3 class="friend-links-application-panel-title">申请条件</h3>
          <ul class="friend-links-application-list">
            <li
              v-for="requirement in application.requirements"
              :key="`requirement-${requirement}`"
              class="friend-links-application-list-item"
            >
              {{ requirement }}
            </li>
          </ul>
        </div>

        <div
          v-if="application.submissionFields.length > 0"
          class="friend-links-application-panel"
        >
          <h3 class="friend-links-application-panel-title">提交信息</h3>
          <ul class="friend-links-application-list">
            <li
              v-for="field in application.submissionFields"
              :key="`field-${field}`"
              class="friend-links-application-list-item"
            >
              {{ field }}
            </li>
          </ul>
        </div>
      </div>

      <div v-if="application.template" class="friend-links-application-template-shell">
        <h3 class="friend-links-application-panel-title">申请模板</h3>
        <pre class="friend-links-application-template">{{ application.template }}</pre>
      </div>

      <div
        v-if="application.contactUrl || application.contactLabel"
        class="friend-links-application-contact"
      >
        <a
          v-if="application.contactUrl"
          :href="application.contactUrl"
          :target="isExternalHref(application.contactUrl) ? '_blank' : undefined"
          :rel="isExternalHref(application.contactUrl) ? 'noreferrer' : undefined"
          class="friend-links-application-contact-link"
        >
          {{ application.contactLabel || '联系我申请友链' }}
        </a>
        <p v-else class="friend-links-application-contact-text">
          {{ application.contactLabel }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../../stores/config'

const props = defineProps({
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

const application = computed(() => {
  const normalizedApplication = props.page?.application || {}

  return {
    enabled: Boolean(normalizedApplication.enabled),
    title: String(normalizedApplication.title || '').trim(),
    description: String(normalizedApplication.description || '').trim(),
    requirements: Array.isArray(normalizedApplication.requirements)
      ? normalizedApplication.requirements.map(item => String(item || '').trim()).filter(Boolean)
      : [],
    submissionFields: Array.isArray(normalizedApplication.submissionFields)
      ? normalizedApplication.submissionFields.map(item => String(item || '').trim()).filter(Boolean)
      : [],
    template: String(normalizedApplication.template || '').trim(),
    contactLabel: String(normalizedApplication.contactLabel || '').trim(),
    contactUrl: String(normalizedApplication.contactUrl || '').trim()
  }
})

const friendLinks = computed(() => (
  Array.isArray(configStore.friendLinks)
    ? configStore.friendLinks
      .map((link) => {
        const name = String(link?.name || '').trim()
        const url = String(link?.url || '').trim()
        const description = String(link?.description || '').trim()
        const location = String(link?.location || '').trim()
        const note = String(link?.note || '').trim()
        const avatarUrl = resolveAssetUrl(String(link?.avatarUrl || '').trim())
        const tags = Array.isArray(link?.tags)
          ? link.tags.map(tag => String(tag || '').trim()).filter(Boolean)
          : []

        if (!name || !url) {
          return null
        }

        return {
          id: String(link?.id || `${name}-${url}`).trim(),
          name,
          url,
          description,
          avatarUrl,
          hostname: getHostnameLabel(url),
          details: [location, note].filter(Boolean),
          tags
        }
      })
      .filter(Boolean)
    : []
))

function resolveAssetUrl(value) {
  if (!value) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) {
    return value
  }

  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedPath = value.replace(/^\.?\//, '').replace(/^\/+/, '')
  return `${baseUrl}${normalizedPath}`.replace(/(?<!:)\/{2,}/g, '/')
}

function getHostnameLabel(value) {
  try {
    const url = new URL(value)
    return url.hostname.replace(/^www\./i, '')
  } catch {
    return value.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  }
}

function getAvatarFallback(name) {
  return String(name || '?').trim().charAt(0).toUpperCase()
}

function isExternalHref(value) {
  return /^(https?:)?\/\//i.test(String(value || '').trim())
}
</script>

<style scoped>
.friend-links-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.friend-links-intro {
  display: grid;
  gap: 0.9rem;
}

.friend-links-intro-copy {
  margin: 0;
  color: rgb(71 85 105);
  line-height: 1.85;
  overflow-wrap: anywhere;
}

.friend-links-grid {
  display: grid;
  gap: 1.2rem;
  grid-template-columns: 1fr;
}

.friend-link-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  text-decoration: none;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.friend-link-card:hover {
  transform: translateY(-3px);
}

.friend-link-card-head {
  display: flex;
  align-items: flex-start;
  gap: 0.95rem;
}

.friend-link-avatar-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  background: linear-gradient(180deg, rgba(219, 234, 254, 0.76), rgba(239, 246, 255, 0.96));
  border: 1px solid rgba(191, 219, 254, 0.95);
  overflow: hidden;
  flex-shrink: 0;
}

.friend-link-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.friend-link-avatar-fallback {
  color: rgb(37 99 235);
  font-size: 1.25rem;
  font-weight: 700;
}

.friend-link-heading {
  min-width: 0;
}

.friend-link-title {
  margin: 0;
  color: rgb(15 23 42);
  font-size: 1.02rem;
  line-height: 1.35;
  font-weight: 700;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}

.friend-link-host {
  margin: 0.18rem 0 0;
  color: rgb(100 116 139);
  font-size: 0.8rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.friend-link-description {
  margin: 0;
  color: rgb(71 85 105);
  line-height: 1.75;
  overflow-wrap: anywhere;
}

.friend-link-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.friend-link-tag {
  display: inline-flex;
  align-items: center;
  min-height: 1.5rem;
  padding: 0.18rem 0.58rem;
  border-radius: 9999px;
  background: rgba(239, 246, 255, 0.95);
  color: rgb(37 99 235);
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
}

.friend-link-details {
  display: grid;
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.friend-link-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  margin-top: auto;
  width: 100%;
  color: rgb(37 99 235);
  font-size: 0.84rem;
  font-weight: 600;
}

.friend-link-action-icon {
  width: 1rem;
  height: 1rem;
}

.friend-links-application {
  display: grid;
  gap: 1.2rem;
}

.friend-links-application-head {
  display: grid;
  gap: 0.55rem;
}

.friend-links-application-kicker {
  margin: 0;
  color: rgb(148 163 184);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.friend-links-application-title {
  margin: 0;
  color: rgb(15 23 42);
  font-size: 1.2rem;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.friend-links-application-description {
  margin: 0;
  color: rgb(71 85 105);
  line-height: 1.8;
}

.friend-links-application-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

.friend-links-application-panel {
  padding: 1rem 1.05rem;
  border-radius: 1.1rem;
  border: 1px solid rgba(226, 232, 240, 0.92);
  background: rgba(248, 250, 252, 0.82);
}

.friend-links-application-panel-title {
  margin: 0 0 0.75rem;
  color: rgb(15 23 42);
  font-size: 0.96rem;
  line-height: 1.4;
  font-weight: 700;
}

.friend-links-application-list {
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding-left: 1.1rem;
  color: rgb(71 85 105);
  line-height: 1.75;
}

.friend-links-application-list-item::marker {
  color: rgb(37 99 235);
}

.friend-links-application-template-shell {
  display: grid;
  gap: 0.75rem;
}

.friend-links-application-template {
  margin: 0;
  padding: 1rem 1.05rem;
  overflow-x: auto;
  border-radius: 1.1rem;
  border: 1px solid rgba(191, 219, 254, 0.85);
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.92), rgba(248, 250, 252, 0.98));
  color: rgb(30 41 59);
  font-size: 0.86rem;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.friend-links-application-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
}

.friend-links-application-contact-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.55rem 1rem;
  border-radius: 9999px;
  background: rgba(37, 99, 235, 0.1);
  color: rgb(37 99 235);
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.18s ease, transform 0.18s ease;
}

.friend-links-application-contact-link:hover {
  background: rgba(37, 99, 235, 0.14);
  transform: translateY(-1px);
}

.friend-links-application-contact-text {
  margin: 0;
  color: rgb(71 85 105);
  line-height: 1.75;
}

@media (min-width: 640px) {
  .friend-links-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .friend-links-application-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

@media (max-width: 640px) {
  .friend-links-page {
    gap: 1rem;
  }

  .friend-link-card {
    gap: 0.85rem;
    padding: 1rem;
  }

  .friend-link-avatar-shell {
    width: 3rem;
    height: 3rem;
    border-radius: 0.9rem;
  }

  .friend-link-title {
    font-size: 0.98rem;
  }

  .friend-link-description,
  .friend-links-application-description,
  .friend-links-application-list,
  .friend-links-application-contact-text {
    font-size: 0.95rem;
    line-height: 1.7;
  }

  .friend-links-application-panel,
  .friend-links-application-template {
    padding: 0.9rem;
    border-radius: 0.95rem;
  }

  .friend-links-application-contact-link {
    width: 100%;
  }
}
</style>
