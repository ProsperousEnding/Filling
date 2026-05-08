<template>
  <section
    v-if="visibleAnnouncement"
    class="announcement-shell"
    :data-variant="announcement.variant"
    role="status"
    aria-live="polite"
  >
    <div class="blog-container">
      <div class="announcement-card">
        <div class="announcement-copy">
          <span class="announcement-badge">{{ badgeLabel }}</span>
          <div class="announcement-content">
            <strong v-if="announcement.title" class="announcement-title">{{ announcement.title }}</strong>
            <p v-if="announcement.content" class="announcement-text">{{ announcement.content }}</p>
          </div>
        </div>

        <div class="announcement-actions">
          <component
            :is="announcement.external ? 'a' : 'router-link'"
            v-if="announcement.linkUrl && announcement.linkText"
            :href="announcement.external ? announcement.linkUrl : undefined"
            :to="announcement.external ? undefined : announcement.linkUrl"
            :target="announcement.external ? '_blank' : undefined"
            :rel="announcement.external ? 'noreferrer' : undefined"
            class="announcement-link"
          >
            {{ announcement.linkText }}
          </component>

          <button
            v-if="announcement.dismissible"
            type="button"
            class="announcement-dismiss"
            aria-label="关闭公告"
            @click="dismissAnnouncement"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useConfigStore } from '../../stores/config'

const configStore = useConfigStore()
const dismissed = ref(false)

const announcement = computed(() => configStore.announcement || {})
const badgeLabel = computed(() => {
  switch (announcement.value.variant) {
    case 'success':
      return '更新'
    case 'warning':
      return '提醒'
    default:
      return '公告'
  }
})
const announcementStorageKey = computed(() => {
  if (!announcement.value?.enabled || !announcement.value?.dismissible) {
    return ''
  }

  const identity = announcement.value.id
    || [announcement.value.title, announcement.value.content, announcement.value.linkUrl]
      .filter(Boolean)
      .join('|')

  if (!identity) {
    return ''
  }

  return `vue-blog-announcement:dismissed:${encodeURIComponent(identity).slice(0, 160)}`
})
const visibleAnnouncement = computed(() => (
  announcement.value?.enabled === true
  && Boolean(announcement.value.title || announcement.value.content)
  && (!announcement.value.dismissible || !dismissed.value)
))

function syncDismissedState() {
  if (
    typeof window === 'undefined'
    || !announcement.value?.dismissible
    || !announcementStorageKey.value
  ) {
    dismissed.value = false
    return
  }

  dismissed.value = window.localStorage.getItem(announcementStorageKey.value) === '1'
}

function dismissAnnouncement() {
  if (typeof window !== 'undefined' && announcementStorageKey.value) {
    window.localStorage.setItem(announcementStorageKey.value, '1')
  }

  dismissed.value = true
}

watch(
  [announcementStorageKey, () => announcement.value?.dismissible, () => announcement.value?.enabled],
  syncDismissedState,
  { immediate: true }
)
</script>

<style scoped>
.announcement-shell {
  padding: 0.8rem 0 0;
}

.announcement-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1.15rem;
  border-radius: 1.4rem;
  border: 1px solid rgba(191, 219, 254, 0.95);
  background:
    radial-gradient(circle at top right, rgba(191, 219, 254, 0.45), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 252, 0.94));
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
}

.announcement-shell[data-variant='success'] .announcement-card {
  border-color: rgba(167, 243, 208, 0.92);
  background:
    radial-gradient(circle at top right, rgba(167, 243, 208, 0.36), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(240, 253, 244, 0.94));
}

.announcement-shell[data-variant='warning'] .announcement-card {
  border-color: rgba(253, 230, 138, 0.96);
  background:
    radial-gradient(circle at top right, rgba(253, 230, 138, 0.34), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(255, 251, 235, 0.94));
}

.announcement-copy {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.announcement-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.1rem;
  min-height: 1.8rem;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  background: rgba(37, 99, 235, 0.1);
  color: rgb(37 99 235);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.announcement-shell[data-variant='success'] .announcement-badge {
  background: rgba(16, 185, 129, 0.12);
  color: rgb(5 150 105);
}

.announcement-shell[data-variant='warning'] .announcement-badge {
  background: rgba(245, 158, 11, 0.14);
  color: rgb(217 119 6);
}

.announcement-content {
  min-width: 0;
}

.announcement-title {
  display: block;
  color: rgb(15 23 42);
  font-size: 0.94rem;
  line-height: 1.5;
}

.announcement-text {
  margin: 0.12rem 0 0;
  color: rgb(71 85 105);
  font-size: 0.9rem;
  line-height: 1.65;
}

.announcement-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-shrink: 0;
}

.announcement-link {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.34rem 0.9rem;
  border-radius: 9999px;
  color: rgb(37 99 235);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.announcement-link:hover {
  background: rgba(219, 234, 254, 0.72);
}

.announcement-dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: rgb(100 116 139);
  transition: background-color 0.18s ease, color 0.18s ease;
}

.announcement-dismiss:hover {
  background: rgba(241, 245, 249, 0.96);
  color: rgb(37 99 235);
}

@media (max-width: 767px) {
  .announcement-card {
    align-items: flex-start;
    flex-direction: column;
    padding: 0.95rem 1rem;
  }

  .announcement-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
