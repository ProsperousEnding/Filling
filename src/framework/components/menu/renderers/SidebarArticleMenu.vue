<template>
  <ul class="sidebar-nav-list sidebar-nav-list-latest">
    <li v-for="item in normalizedItems" :key="item.key">
      <component
        :is="item.external ? 'a' : RouterLink"
        v-bind="item.external ? { href: item.href } : { to: item.to }"
        class="sidebar-nav-item sidebar-nav-item-article"
        :target="item.external ? '_blank' : undefined"
        :rel="item.external ? 'noreferrer' : undefined"
        :active-class="item.external ? undefined : 'sidebar-nav-item-active'"
      >
        <div class="sidebar-nav-meta">
          <h5 class="sidebar-nav-title">{{ item.label }}</h5>
          <div class="sidebar-nav-submeta">
            <span class="sidebar-nav-submeta-item">
              <svg xmlns="http://www.w3.org/2000/svg" class="sidebar-nav-submeta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="sidebar-nav-date">{{ item.meta }}</span>
            </span>
          </div>
        </div>
      </component>
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const normalizedItems = computed(() => (
  (Array.isArray(props.items) ? props.items : [])
    .map((item, index) => ({
      key: item?.key || item?.id || item?.slug || `sidebar-article-${index}`,
      label: String(item?.label || item?.title || ''),
      meta: String(item?.meta || ''),
      to: item?.to || item?.path || '/',
      href: item?.href || '',
      external: item?.external === true
    }))
    .filter(item => item.label)
))
</script>

<style scoped>
.sidebar-nav-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sidebar-nav-list-latest > li + li {
  margin-top: 0.14rem;
}

.sidebar-nav-item {
  color: var(--theme-text-soft);
  cursor: pointer;
  transition: color 0.18s ease, background-color 0.18s ease;
}

.sidebar-nav-item-article {
  display: block;
  min-height: auto;
  margin-inline: -0.5rem;
  padding: 0.34rem 0.5rem;
  border-radius: 0.5rem;
}

.sidebar-nav-item:hover {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--theme-panel-strong) 88%, transparent),
    color-mix(in srgb, var(--theme-panel-muted) 78%, transparent)
  );
  color: var(--theme-heading-color);
  box-shadow:
    inset 0 1px 0 var(--sidebar-inner-highlight, var(--theme-control-highlight)),
    0 1px 2px var(--sidebar-contact-shadow, rgba(15, 23, 42, 0.06));
}

.sidebar-nav-item:focus-visible {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--theme-panel-strong) 88%, transparent),
    color-mix(in srgb, var(--theme-accent-softer) 82%, transparent)
  );
  color: var(--theme-heading-color);
  outline: 2px solid rgba(var(--color-primary), 0.4);
  outline-offset: 0.08rem;
}

.sidebar-nav-item-active {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--theme-panel-strong) 88%, transparent),
    color-mix(in srgb, var(--theme-accent-soft) 82%, transparent)
  );
  color: var(--theme-link);
  box-shadow:
    inset 0 1px 0 var(--sidebar-inner-highlight, var(--theme-control-highlight)),
    0 1px 2px var(--sidebar-contact-shadow, rgba(15, 23, 42, 0.06));
}

.sidebar-nav-meta {
  min-width: 0;
}

.sidebar-nav-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.35;
  font-weight: 600;
  color: inherit;
}

.sidebar-nav-submeta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.18rem;
  margin-top: 0.18rem;
  color: var(--theme-text-soft);
  font-size: 0.6875rem;
}

.sidebar-nav-submeta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
}

.sidebar-nav-submeta-icon {
  width: 0.6875rem;
  height: 0.6875rem;
  flex-shrink: 0;
}

.sidebar-nav-date {
  display: block;
  margin: 0;
  font-size: 0.6875rem;
}

</style>
