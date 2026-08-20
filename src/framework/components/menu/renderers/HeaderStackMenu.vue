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
        :class="{
          'site-mobile-nav-link-group': item.children.length && !hasTarget(item),
          'site-mobile-nav-link-active': isActive(item)
        }"
        :target="item.external ? '_blank' : undefined"
        :rel="item.external ? 'noreferrer' : undefined"
        :type="!hasTarget(item) && item.children.length === 0 ? 'button' : undefined"
        :role="!hasTarget(item) && item.children.length > 0 ? 'group' : undefined"
        :aria-label="!hasTarget(item) && item.children.length > 0 ? item.label : undefined"
        :tabindex="hasTarget(item) || item.children.length === 0 ? 0 : undefined"
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
          :class="{ 'site-mobile-nav-child-link-active': isActive(child) }"
          :target="child.external ? '_blank' : undefined"
          :rel="child.external ? 'noreferrer' : undefined"
          :type="!hasTarget(child) && child.children.length === 0 ? 'button' : undefined"
          tabindex="0"
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

import {
  getMenuItemComponent,
  getMenuItemHref,
  getMenuItemTo,
  hasMenuItemTarget,
  isMenuItemActive,
  normalizeMenuItems
} from '../../../utils/menuItemPresentation.js'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  activePath: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select'])

const normalizedItems = computed(() => normalizeMenuItems(props.items))

const hasTarget = hasMenuItemTarget
const getItemTo = getMenuItemTo
const getItemHref = getMenuItemHref

function getItemComponent(item) {
  return getMenuItemComponent(item, 'div')
}

function isActive(item) {
  return isMenuItemActive(item, props.activePath)
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

.site-mobile-nav-link:hover,
.site-mobile-nav-link-active {
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

.site-mobile-nav-child-link:hover,
.site-mobile-nav-child-link-active {
  color: rgb(37 99 235);
  background: rgba(239, 246, 255, 0.96);
}

.site-mobile-nav-icon {
  line-height: 1.35;
}

.site-mobile-nav-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
}

.site-mobile-nav-child-text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  overflow-wrap: anywhere;
}

.site-mobile-nav-description {
  color: rgb(100 116 139);
  font-size: 0.75rem;
  line-height: 1.35;
}

:global(.dark .site-mobile-nav-link) {
  color: rgb(203 213 225);
  background: rgba(15, 23, 42, 0.72);
  border-color: rgba(71, 85, 105, 0.85);
}

:global(.dark .site-mobile-nav-link:hover),
:global(.dark .site-mobile-nav-link-active) {
  color: rgb(191 219 254);
  background: rgba(30, 41, 59, 0.96);
}

:global(.dark .site-mobile-nav-child-link) {
  color: rgb(203 213 225);
  background: rgba(15, 23, 42, 0.5);
  border-color: rgba(71, 85, 105, 0.72);
}

:global(.dark .site-mobile-nav-child-link:hover),
:global(.dark .site-mobile-nav-child-link-active) {
  color: rgb(191 219 254);
  background: rgba(30, 41, 59, 0.96);
}

:global(.dark .site-mobile-nav-description) {
  color: rgb(148 163 184);
}
</style>
