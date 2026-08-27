<template>
  <nav ref="navElement" class="site-header-nav hidden min-w-0 items-center lg:flex" @keydown.esc="handleEscape">
    <div class="site-header-nav-shell px-1 py-1 flex items-center">
      <div
        v-for="(item, index) in normalizedItems"
        :key="item.key"
        class="site-header-nav-item relative"
        :class="{ 'site-header-nav-item-open': openItemKey === item.key }"
        @pointerenter="handleItemPointerEnter($event, item)"
        @pointerleave="handleItemPointerLeave"
        @focusout="handleItemFocusOut($event, item)"
      >
        <component
          :is="getItemComponent(item)"
          v-bind="getItemTargetProps(item)"
          class="site-header-nav-link relative px-3 py-1 text-sm"
          :class="{ 'site-header-nav-link-active': isActive(item) }"
          :target="item.external ? '_blank' : undefined"
          :rel="item.external ? 'noreferrer' : undefined"
          :type="hasTarget(item) ? undefined : 'button'"
          :aria-expanded="item.children.length ? openItemKey === item.key : undefined"
          :aria-controls="item.children.length ? getDropdownId(item, index) : undefined"
          :title="item.label"
          tabindex="0"
          @focus="handleTriggerFocus($event, item)"
          @click="handleTriggerClick($event, item)"
          @keydown="handleTriggerKeydown($event, item)"
        >
          <span v-if="item.icon" class="site-header-nav-icon">{{ item.icon }}</span>
          <span class="site-header-nav-label">{{ item.label }}</span>
          <span v-if="item.children.length" class="site-header-nav-caret" aria-hidden="true">v</span>
        </component>

        <div
          v-if="item.children.length"
          :id="getDropdownId(item, index)"
          class="site-header-nav-dropdown"
          :aria-label="item.label"
          :aria-hidden="openItemKey !== item.key"
        >
          <component
            :is="getItemComponent(child)"
            v-for="child in item.children"
            :key="child.key"
            v-bind="getItemTargetProps(child)"
            class="site-header-nav-dropdown-link"
            :class="{ 'site-header-nav-dropdown-link-active': isActive(child) }"
            :target="child.external ? '_blank' : undefined"
            :rel="child.external ? 'noreferrer' : undefined"
            :type="hasTarget(child) ? undefined : 'button'"
            tabindex="0"
            @click="closeMenu"
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import {
  getMenuItemComponent,
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

const navElement = ref(null)
const openItemKey = ref('')

const normalizedItems = computed(() => normalizeMenuItems(props.items))

const hasTarget = hasMenuItemTarget
function getItemTargetProps(item) {
  return item.external
    ? { href: item.href }
    : { to: item.to }
}

function getItemComponent(item) {
  return getMenuItemComponent(item)
}

function isActive(item) {
  return isMenuItemActive(item, props.activePath)
}

function getDropdownId(item, index) {
  return `site-header-menu-${String(item.key || index).replace(/[^a-z0-9_-]/gi, '-')}`
}

function openMenu(item) {
  if (item.children.length > 0) {
    openItemKey.value = item.key
  }
}

function closeMenu() {
  openItemKey.value = ''
}

function handleTriggerClick(event, item) {
  if (item.children.length > 0 && !hasTarget(item)) {
    event.preventDefault()

    if (event.detail === 0 && openItemKey.value === item.key) {
      focusFirstChild(event, item)
      return
    }

    openItemKey.value = openItemKey.value === item.key ? '' : item.key
    return
  }

  closeMenu()
}

function handleTriggerFocus(event, item) {
  if (event.currentTarget.matches(':focus-visible')) {
    openMenu(item)
  }
}

function handleTriggerKeydown(event, item) {
  if (event.key !== 'ArrowDown') {
    return
  }

  event.preventDefault()
  focusFirstChild(event, item)
}

function focusFirstChild(event, item) {
  if (item.children.length === 0) {
    return
  }

  const trigger = event.currentTarget
  openMenu(item)
  nextTick(() => {
    trigger
      ?.closest('.site-header-nav-item')
      ?.querySelector('.site-header-nav-dropdown-link')
      ?.focus()
  })
}

function handleEscape(event) {
  if (!openItemKey.value) {
    return
  }

  const trigger = event.target
    ?.closest('.site-header-nav-item')
    ?.querySelector('.site-header-nav-link')

  trigger?.focus()
  closeMenu()
}

function handleItemPointerEnter(event, item) {
  if (event.pointerType !== 'touch') {
    openMenu(item)
  }
}

function handleItemPointerLeave(event) {
  if (event.pointerType === 'touch') {
    return
  }

  if (!event.currentTarget.contains(document.activeElement)) {
    closeMenu()
  }
}

function handleItemFocusOut(event, item) {
  if (
    openItemKey.value === item.key
    && !event.currentTarget.contains(event.relatedTarget)
  ) {
    closeMenu()
  }
}

function handleDocumentPointerDown(event) {
  if (!navElement.value?.contains(event.target)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<style scoped>
.site-header-nav-shell {
  min-width: 0;
  max-width: 100%;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: var(--theme-radius-item);
  padding: 0.1875rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.58);
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
  min-height: 1.625rem;
  padding: 0.2rem 0.65rem;
  border-radius: 0.4375rem;
  background: transparent;
  font: inherit;
  font-size: 0.8125rem;
  line-height: 1.15;
}

.site-header-nav-label {
  display: block;
  max-width: 7rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.site-header-nav-link:hover {
  color: rgb(37 99 235);
  background: rgba(239, 246, 255, 0.92);
}

.site-header-nav-link-active {
  color: rgb(15 23 42);
  background: rgb(255 255 255);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
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
  max-height: min(70vh, 32rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.35rem;
  border-radius: 0.875rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.14);
  transform: translate(-50%, 0.35rem);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s ease, visibility 0s linear 0.16s;
}

.site-header-nav-item-open .site-header-nav-dropdown {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translate(-50%, 0);
  transition-delay: 0s;
}

.site-header-nav-item:last-child .site-header-nav-dropdown {
  right: 0;
  left: auto;
  transform: translate(0, 0.35rem);
}

.site-header-nav-item:last-child.site-header-nav-item-open .site-header-nav-dropdown {
  transform: translate(0, 0);
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

@media (max-width: 1199px) {
  .site-header-nav-link {
    padding-inline: 0.65rem;
  }

  .site-header-nav-label {
    max-width: 4.5rem;
  }
}

:global(.dark .site-header-nav-shell) {
  background: rgba(15, 23, 42, 0.68);
  border-color: rgba(71, 85, 105, 0.85);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

:global(.dark .site-header-nav-link) {
  color: rgb(203 213 225);
}

:global(.dark .site-header-nav-link:hover) {
  color: rgb(191 219 254);
  background: rgba(30, 41, 59, 0.92);
}

:global(.dark .site-header-nav-link-active) {
  color: rgb(255 255 255);
  background: rgba(59, 130, 246, 0.22);
  box-shadow: none;
}

:global(.dark .site-header-nav-dropdown) {
  background: rgba(15, 23, 42, 0.96);
  border-color: rgba(71, 85, 105, 0.9);
  box-shadow: 0 18px 45px rgba(2, 6, 23, 0.42);
}

:global(.dark .site-header-nav-dropdown-link) {
  color: rgb(203 213 225);
}

:global(.dark .site-header-nav-dropdown-link:hover),
:global(.dark .site-header-nav-dropdown-link-active) {
  color: rgb(191 219 254);
  background: rgba(30, 41, 59, 0.92);
}

:global(.dark .site-header-nav-dropdown-description) {
  color: rgb(148 163 184);
}
</style>
