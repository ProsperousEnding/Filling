<template>
  <div class="guestbook-page">
    <div v-if="contentBlocks.length > 0" class="guestbook-intro theme-list-card rounded-2xl p-5 sm:p-6">
      <p
        v-for="(block, index) in contentBlocks"
        :key="`${page.key}-intro-${index}`"
        class="guestbook-intro-copy"
      >
        {{ block }}
      </p>
    </div>

    <section
      v-if="guestbookConfig.enabled"
      class="guestbook-guide theme-list-card rounded-2xl p-5 sm:p-6"
    >
      <div class="guestbook-guide-head">
        <p class="guestbook-guide-kicker">{{ guestbookConfig.kicker }}</p>
        <h2 class="guestbook-guide-title">{{ guestbookConfig.title }}</h2>
        <p v-if="guestbookConfig.description" class="guestbook-guide-description">
          {{ guestbookConfig.description }}
        </p>
      </div>

      <div
        v-if="guestbookConfig.guidelines.length > 0"
        class="guestbook-guide-panel"
      >
        <h3 class="guestbook-guide-panel-title">留言建议</h3>
        <ul class="guestbook-guide-list">
          <li
            v-for="guideline in guestbookConfig.guidelines"
            :key="guideline"
            class="guestbook-guide-list-item"
          >
            {{ guideline }}
          </li>
        </ul>
      </div>

      <div v-if="guestbookConfig.template" class="guestbook-guide-panel">
        <h3 class="guestbook-guide-panel-title">留言模板</h3>
        <pre class="guestbook-guide-template">{{ guestbookConfig.template }}</pre>
      </div>

      <div
        v-if="guestbookConfig.contactUrl || guestbookConfig.contactLabel"
        class="guestbook-guide-contact"
      >
        <a
          v-if="guestbookConfig.contactUrl"
          :href="guestbookConfig.contactUrl"
          :target="guestbookConfig.contactExternal ? '_blank' : undefined"
          :rel="guestbookConfig.contactExternal ? 'noreferrer' : undefined"
          class="guestbook-guide-contact-link"
        >
          {{ guestbookConfig.contactLabel || '联系我' }}
        </a>
        <p v-else class="guestbook-guide-contact-text">
          {{ guestbookConfig.contactLabel }}
        </p>
      </div>
    </section>

    <div
      v-else
      class="theme-empty-state py-8 text-center"
    >
      <p class="theme-empty-text">留言板尚未启用。</p>
    </div>

    <CommentSection
      v-if="guestbookConfig.enabled"
      :options="commentOptions"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CommentSection from '../../components/core/CommentSection.vue'
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

const guestbookConfig = computed(() => (
  configStore.guestbookConfig || {
    enabled: false,
    kicker: '留言板',
    title: '欢迎留下你的来访足迹',
    description: '',
    guidelines: [],
    template: '',
    contactLabel: '',
    contactUrl: '',
    contactExternal: false,
    commentTitle: '开始留言',
    commentDescription: '',
    commentNotReadyText: '',
    commentOptions: {}
  }
))

const commentOptions = computed(() => (
  guestbookConfig.value.commentOptions || {
    title: guestbookConfig.value.commentTitle,
    description: guestbookConfig.value.commentDescription,
    notReadyText: guestbookConfig.value.commentNotReadyText
  }
))
</script>

<style scoped>
.guestbook-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.guestbook-intro {
  display: grid;
  gap: 0.9rem;
}

.guestbook-intro-copy {
  margin: 0;
  color: rgb(71 85 105);
  line-height: 1.85;
  overflow-wrap: anywhere;
}

.guestbook-guide {
  display: grid;
  gap: 1rem;
}

.guestbook-guide-head {
  display: grid;
  gap: 0.55rem;
}

.guestbook-guide-kicker {
  margin: 0;
  color: rgb(148 163 184);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.guestbook-guide-title {
  margin: 0;
  color: rgb(15 23 42);
  font-size: 1.2rem;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.guestbook-guide-description {
  margin: 0;
  color: rgb(100 116 139);
  line-height: 1.8;
}

.guestbook-guide-panel {
  display: grid;
  gap: 0.85rem;
}

.guestbook-guide-panel-title {
  margin: 0;
  color: rgb(30 41 59);
  font-size: 0.95rem;
  line-height: 1.45;
  font-weight: 700;
}

.guestbook-guide-list {
  display: grid;
  gap: 0.65rem;
  margin: 0;
  padding-left: 1.1rem;
  color: rgb(71 85 105);
  line-height: 1.75;
}

.guestbook-guide-list-item::marker {
  color: rgb(59 130 246);
}

.guestbook-guide-template {
  margin: 0;
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.96);
  border: 1px solid rgba(226, 232, 240, 0.96);
  color: rgb(51 65 85);
  font-size: 0.92rem;
  line-height: 1.75;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.guestbook-guide-contact-link {
  color: rgb(37 99 235);
  font-weight: 600;
  text-decoration: none;
}

.guestbook-guide-contact-link:hover {
  text-decoration: underline;
}

.guestbook-guide-contact-text {
  margin: 0;
  color: rgb(71 85 105);
  line-height: 1.8;
}

@media (max-width: 640px) {
  .guestbook-page {
    gap: 1rem;
  }

  .guestbook-guide-title {
    font-size: 1.08rem;
  }
}
</style>
