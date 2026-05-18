<template>
  <nav class="site-header-nav hidden md:flex items-center">
    <div class="site-header-nav-shell rounded-full px-1 py-1 flex items-center">
      <div
        v-for="item in normalizedItems"
        :key="item.key"
        class="site-header-nav-item relative"
      >
        <component
          :is="getItemComponent(item)"
          :to="getItemTo(item)"
          :href="getItemHref(item)"
          class="site-header-nav-link relative px-4 py-1.5 text-sm rounded-full transition-all duration-200"
          :class="{ 'site-header-nav-link-active': isActive(item) }"
          :target="item.external ? '_blank' : undefined"
          :rel="item.external ? 'noreferrer' : undefined"
          :type="hasTarget(item) ? undefined : 'button'"
          :aria-haspopup="item.children.length ? 'menu' : undefined"
        >
          <span v-if="item.icon" class="site-header-nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
          <span v-if="item.children.length" class="site-header-nav-caret" aria-hidden="true">v</span>
        </component>

        <div
          v-if="item.children.length"
          class="site-header-nav-dropdown"
          role="menu"
        >
          <component
            :is="getItemComponent(child)"
            v-for="child in item.children"
            :key="child.key"
            :to="getItemTo(child)"
            :href="getItemHref(child)"
            class="site-header-nav-dropdown-link"
            :class="{ 'site-header-nav-dropdown-link-active': isActive(child) }"
            :target="child.external ? '_blank' : undefined"
            :rel="child.external ? 'noreferrer' : undefined"
            :type="hasTarget(child) ? undefined : 'button'"
            role="menuitem"
          >
            <span v-if="child.icon" class="site-header-nav-dropdown-icon">{{ child.icon }}</span>
            <span class="site-header-nav-dropdown-text">
              <span class="site-header-nav-dropdown-label">{{ child.label }}</span>
              <span v-if="child.description || child.meta" class="site-header-nav-dropdown-description">
                {{ child.description || child.meta }}
              </span>
            </span>
          </component>
        </div>
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
  },
  activePath: {
    type: String,
    default: ''
  }
})

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
    matchPath: item?.matchPath || item?.path || item?.to || '',
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

function isActive(item) {
  const currentPath = String(props.activePath || '')
  const targetPath = String(item.matchPath || item.to || '')

  if (Array.isArray(item.children) && item.children.some(child => isActive(child))) {
    return true
  }

  if (!currentPath || !targetPath) {
    return false
  }

  if (targetPath === '/') {
    return currentPath === '/'
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}
</script>

<style scoped>
.site-header-nav-shell {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.site-header-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  justify-content: center;
  cursor: pointer;
  color: rgb(71 85 105);
  white-space: nowrap;
  border: 0;
  background: transparent;
  font: inherit;
}

.site-header-nav-link:hover {
  color: rgb(37 99 235);
  background: rgba(239, 246, 255, 0.92);
}

.site-header-nav-link-active {
  color: rgb(15 23 42);
  background: rgb(255 255 255);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.site-header-nav-caret {
  font-size: 0.75rem;
  line-height: 1;
  opacity: 0.72;
}

.site-header-nav-icon,
.site-header-nav-dropdown-icon {
  line-height: 1;
}

.site-header-nav-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 50%;
  z-index: 40;
  min-width: 14rem;
  max-width: min(18rem, calc(100vw - 2rem));
  padding: 0.35rem;
  border-radius: 0.875rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.14);
  transform: translate(-50%, 0.35rem);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.site-header-nav-item:hover .site-header-nav-dropdown,
.site-header-nav-item:focus-within .site-header-nav-dropdown {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, 0);
}

.site-header-nav-dropdown-link {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  width: 100%;
  padding: 0.65rem 0.7rem;
  border: 0;
  border-radius: 0.65rem;
  background: transparent;
  color: rgb(51 65 85);
  cursor: pointer;
  font: inherit;
  text-align: left;
  text-decoration: none;
  transition: background 0.16s ease, color 0.16s ease;
}

.site-header-nav-dropdown-link:hover,
.site-header-nav-dropdown-link-active {
  color: rgb(37 99 235);
  background: rgba(239, 246, 255, 0.92);
}

.site-header-nav-dropdown-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.site-header-nav-dropdown-label {
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.25;
}

.site-header-nav-dropdown-description {
  color: rgb(100 116 139);
  font-size: 0.75rem;
  line-height: 1.35;
  white-space: normal;
}

:global(.dark) .site-header-nav-shell {
  background: rgba(15, 23, 42, 0.68);
  border-color: rgba(71, 85, 105, 0.85);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

:global(.dark) .site-header-nav-link {
  color: rgb(203 213 225);
}

:global(.dark) .site-header-nav-link:hover {
  color: rgb(191 219 254);
  background: rgba(30, 41, 59, 0.92);
}

:global(.dark) .site-header-nav-link-active {
  color: rgb(255 255 255);
  background: rgba(59, 130, 246, 0.22);
  box-shadow: none;
}

:global(.dark) .site-header-nav-dropdown {
  background: rgba(15, 23, 42, 0.96);
  border-color: rgba(71, 85, 105, 0.9);
  box-shadow: 0 18px 45px rgba(2, 6, 23, 0.42);
}

:global(.dark) .site-header-nav-dropdown-link {
  color: rgb(203 213 225);
}

:global(.dark) .site-header-nav-dropdown-link:hover,
:global(.dark) .site-header-nav-dropdown-link-active {
  color: rgb(191 219 254);
  background: rgba(30, 41, 59, 0.92);
}

:global(.dark) .site-header-nav-dropdown-description {
  color: rgb(148 163 184);
}
</style>
