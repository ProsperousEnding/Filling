<template>
  <nav class="site-mobile-nav-list flex flex-col space-y-2">
    <div
      v-for="item in normalizedItems"
      :key="item.key"
      class="site-mobile-nav-entry"
    >
      <component
        :is="getItemComponent(item)"
        :to="getItemTo(item)"
        :href="getItemHref(item)"
        class="site-mobile-nav-link px-3 py-2 rounded-lg transition-all"
        :class="{ 'site-mobile-nav-link-group': item.children.length && !hasTarget(item) }"
        :target="item.external ? '_blank' : undefined"
        :rel="item.external ? 'noreferrer' : undefined"
        :type="hasTarget(item) ? undefined : 'button'"
        @click="handleSelect(item)"
      >
        <span v-if="item.icon" class="site-mobile-nav-icon">{{ item.icon }}</span>
        <span class="site-mobile-nav-label">{{ item.label }}</span>
      </component>

      <div v-if="item.children.length" class="site-mobile-nav-children">
        <component
          :is="getItemComponent(child)"
          v-for="child in item.children"
          :key="child.key"
          :to="getItemTo(child)"
          :href="getItemHref(child)"
          class="site-mobile-nav-child-link px-3 py-2 rounded-lg transition-all"
          :target="child.external ? '_blank' : undefined"
          :rel="child.external ? 'noreferrer' : undefined"
          :type="hasTarget(child) ? undefined : 'button'"
          @click="handleSelect(child)"
        >
          <span v-if="child.icon" class="site-mobile-nav-icon">{{ child.icon }}</span>
          <span class="site-mobile-nav-child-text">
            <span class="site-mobile-nav-label">{{ child.label }}</span>
            <span v-if="child.description || child.meta" class="site-mobile-nav-description">
              {{ child.description || child.meta }}
            </span>
          </span>
        </component>
      </div>
    </div>
  </nav>
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

const emit = defineEmits(['select'])

const normalizedItems = computed(() => (
  (Array.isArray(props.items) ? props.items : [])
    .map(normalizeItem)
    .filter(item => item.label)
))

function normalizeItem(item, index = 0) {
  const children = (Array.isArray(item?.children) ? item.children : [])
    .map(normalizeItem)
    .filter(child => child.label)

  return {
    key: item?.key || item?.path || item?.name || `menu-item-${index}`,
    label: item?.name || item?.label || '',
    to: item?.to || item?.path || '',
    href: item?.href || '',
    external: item?.external === true,
    icon: item?.icon || '',
    description: item?.description || '',
    meta: item?.meta || '',
    children
  }
}

function hasTarget(item) {
  return Boolean(item?.to || item?.href)
}

function getItemComponent(item) {
  if (!hasTarget(item)) {
    return 'button'
  }

  return item.external ? 'a' : RouterLink
}

function getItemTo(item) {
  return item.external || !item.to ? undefined : item.to
}

function getItemHref(item) {
  return item.external ? item.href : undefined
}

function handleSelect(item) {
  if (hasTarget(item)) {
    emit('select', item)
  }
}
</script>

<style scoped>
.site-mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: rgb(71 85 105);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.85);
  font: inherit;
  text-align: left;
  width: 100%;
}

.site-mobile-nav-link:hover {
  color: rgb(37 99 235);
  background: rgba(239, 246, 255, 0.96);
}

.site-mobile-nav-link-group {
  cursor: default;
  font-weight: 700;
}

.site-mobile-nav-children {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 0.45rem;
  padding-left: 0.75rem;
}

.site-mobile-nav-child-link {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: rgb(71 85 105);
  background: rgba(248, 250, 252, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.72);
  font: inherit;
  text-align: left;
  width: 100%;
}

.site-mobile-nav-child-link:hover {
  color: rgb(37 99 235);
  background: rgba(239, 246, 255, 0.96);
}

.site-mobile-nav-icon {
  line-height: 1.35;
}

.site-mobile-nav-label {
  min-width: 0;
}

.site-mobile-nav-child-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.site-mobile-nav-description {
  color: rgb(100 116 139);
  font-size: 0.75rem;
  line-height: 1.35;
}

:global(.dark) .site-mobile-nav-link {
  color: rgb(203 213 225);
  background: rgba(15, 23, 42, 0.72);
  border-color: rgba(71, 85, 105, 0.85);
}

:global(.dark) .site-mobile-nav-link:hover {
  color: rgb(191 219 254);
  background: rgba(30, 41, 59, 0.96);
}

:global(.dark) .site-mobile-nav-child-link {
  color: rgb(203 213 225);
  background: rgba(15, 23, 42, 0.5);
  border-color: rgba(71, 85, 105, 0.72);
}

:global(.dark) .site-mobile-nav-child-link:hover {
  color: rgb(191 219 254);
  background: rgba(30, 41, 59, 0.96);
}

:global(.dark) .site-mobile-nav-description {
  color: rgb(148 163 184);
}
</style>
