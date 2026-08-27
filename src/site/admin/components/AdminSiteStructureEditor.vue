<template>
  <section class="admin-site-structure-editor">
    <section id="admin-site-sidebar" class="admin-structure-section">
      <header class="admin-menu-section-header">
        <div>
          <h2>侧边栏顺序</h2>
          <span>{{ activeComponents.length }} 项</span>
        </div>
      </header>

      <div class="admin-structure-mode-row">
        <div class="admin-page-source-control" role="group" aria-label="设备类型">
          <button
            type="button"
            :class="{ active: device === 'desktop' }"
            :aria-pressed="device === 'desktop'"
            @click="device = 'desktop'"
          >
            <Monitor aria-hidden="true" />
            桌面端
          </button>
          <button
            type="button"
            :class="{ active: device === 'mobile' }"
            :aria-pressed="device === 'mobile'"
            @click="device = 'mobile'"
          >
            <Smartphone aria-hidden="true" />
            手机端
          </button>
        </div>

        <div class="admin-page-source-control" role="group" aria-label="页面类型">
          <button
            type="button"
            :class="{ active: pageType === 'default' }"
            :aria-pressed="pageType === 'default'"
            @click="pageType = 'default'"
          >
            普通页面
          </button>
          <button
            type="button"
            :class="{ active: pageType === 'article' }"
            :aria-pressed="pageType === 'article'"
            @click="pageType = 'article'"
          >
            文章页面
          </button>
        </div>
      </div>

      <div class="admin-structure-list">
        <div
          v-for="component in orderedSidebarComponents"
          :key="component.key"
          class="admin-structure-row"
          :class="{ 'admin-structure-row-disabled': !component.enabled }"
        >
          <div class="admin-menu-order-controls">
            <button
              type="button"
              class="admin-icon-command"
              :disabled="!component.enabled || component.index === 0"
              :aria-label="`上移${component.label}`"
              title="上移"
              @click="moveSidebarComponent(component.index, -1)"
            >
              <ArrowUp aria-hidden="true" />
            </button>
            <button
              type="button"
              class="admin-icon-command"
              :disabled="!component.enabled || component.index === activeComponents.length - 1"
              :aria-label="`下移${component.label}`"
              title="下移"
              @click="moveSidebarComponent(component.index, 1)"
            >
              <ArrowDown aria-hidden="true" />
            </button>
          </div>
          <span>{{ component.label }}</span>
          <button
            type="button"
            class="admin-toggle"
            :class="{ 'admin-toggle-active': component.enabled }"
            role="switch"
            :aria-checked="component.enabled"
            :aria-label="`${component.label}显示状态`"
            @click="toggleSidebarComponent(component.key)"
          >
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>

    <section id="admin-site-page-layouts" class="admin-structure-section">
      <header class="admin-menu-section-header">
        <div>
          <h2>内置页面布局</h2>
          <span>5 个页面</span>
        </div>
        <label class="admin-structure-persist-toggle">
          <span>记住访客选择</span>
          <button
            type="button"
            class="admin-toggle"
            :class="{ 'admin-toggle-active': pageLayouts.persist !== false }"
            role="switch"
            :aria-checked="pageLayouts.persist !== false"
            @click="updatePageLayouts('persist', pageLayouts.persist === false)"
          >
            <span aria-hidden="true" />
          </button>
        </label>
      </header>

      <div class="admin-page-layout-list">
        <section v-for="page in pageDefinitions" :key="page.key" class="admin-page-layout-row">
          <strong>{{ page.label }}</strong>
          <label>
            <span>默认布局</span>
            <select
              class="admin-control"
              :value="getPageLayout(page).default"
              :aria-label="`${page.label}默认布局`"
              @change="updatePageLayout(page.key, 'default', $event.target.value)"
            >
              <option v-for="layout in layoutOptions" :key="layout.key" :value="layout.key">
                {{ layout.label }}
              </option>
            </select>
          </label>
          <label class="admin-page-layout-number">
            <span>列数</span>
            <input
              class="admin-control"
              type="number"
              min="1"
              max="4"
              :value="getPageLayout(page).columns"
              :aria-label="`${page.label}列数`"
              @input="updatePageLayout(page.key, 'columns', normalizeColumns($event.target.value))"
            />
          </label>
          <label class="admin-page-layout-number">
            <span>宽屏列数</span>
            <input
              class="admin-control"
              type="number"
              min="1"
              max="4"
              :value="getPageLayout(page).wide_columns"
              :aria-label="`${page.label}宽屏列数`"
              @input="updatePageLayout(page.key, 'wide_columns', normalizeColumns($event.target.value))"
            />
          </label>
          <button
            type="button"
            class="admin-toggle"
            :class="{ 'admin-toggle-active': getPageLayout(page).allow_switch === true }"
            role="switch"
            :aria-checked="getPageLayout(page).allow_switch === true"
            :aria-label="`${page.label}允许访客切换布局`"
            title="允许访客切换布局"
            @click="updatePageLayout(
              page.key,
              'allow_switch',
              getPageLayout(page).allow_switch !== true
            )"
          >
            <span aria-hidden="true" />
          </button>
        </section>
      </div>
    </section>
  </section>
</template>

<script setup>
import { ArrowDown, ArrowUp, Monitor, Smartphone } from '@lucide/vue'
import { computed, ref } from 'vue'

const props = defineProps({
  sidebar: {
    type: Object,
    required: true
  },
  pageLayouts: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:page-layouts', 'update:sidebar'])
const device = ref('desktop')
const pageType = ref('default')

const sidebarOptions = Object.freeze([
  { key: 'profile', label: '个人资料' },
  { key: 'announcement', label: '公告' },
  { key: 'latest-articles', label: '最新文章' },
  { key: 'categories', label: '分类' },
  { key: 'tags', label: '标签' }
])

const pageDefinitions = Object.freeze([
  { key: 'home', label: '首页', default: 'list', columns: 2, wideColumns: 3 },
  { key: 'articles', label: '文章', default: 'card', columns: 2, wideColumns: 2 },
  { key: 'categories', label: '分类', default: 'grid', columns: 2, wideColumns: 3 },
  { key: 'tags', label: '标签', default: 'list', columns: 2, wideColumns: 3 },
  { key: 'archive', label: '归档', default: 'timeline', columns: 2, wideColumns: 3 }
])

const layoutOptions = Object.freeze([
  { key: 'list', label: '列表' },
  { key: 'card', label: '卡片' },
  { key: 'grid', label: '网格' },
  { key: 'timeline', label: '时间线' }
])

const activeSidebarKey = computed(() => {
  if (device.value === 'mobile') {
    return pageType.value === 'article'
      ? 'article_mobile_components'
      : 'mobile_components'
  }
  return pageType.value === 'article'
    ? 'article_desktop_components'
    : 'desktop_components'
})

const activeComponents = computed(() => (
  Array.isArray(props.sidebar[activeSidebarKey.value])
    ? props.sidebar[activeSidebarKey.value]
    : []
))

const orderedSidebarComponents = computed(() => {
  const optionByKey = new Map(sidebarOptions.map(option => [option.key, option]))
  const enabled = activeComponents.value
    .map((key, index) => ({
      ...optionByKey.get(key),
      key,
      label: optionByKey.get(key)?.label || `高级组件：${key}`,
      enabled: true,
      index
    }))
  const enabledKeys = new Set(enabled.map(option => option.key))
  const disabled = sidebarOptions
    .filter(option => !enabledKeys.has(option.key))
    .map(option => ({ ...option, enabled: false, index: -1 }))

  return [...enabled, ...disabled]
})

function emitSidebar(nextComponents) {
  emit('update:sidebar', {
    ...props.sidebar,
    [activeSidebarKey.value]: nextComponents
  })
}

function toggleSidebarComponent(key) {
  const current = activeComponents.value.slice()
  const index = current.indexOf(key)
  if (index >= 0) current.splice(index, 1)
  else current.push(key)
  emitSidebar(current)
}

function moveSidebarComponent(index, direction) {
  const targetIndex = index + direction
  const current = activeComponents.value.slice()
  if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return
  ;[current[index], current[targetIndex]] = [current[targetIndex], current[index]]
  emitSidebar(current)
}

function getPageLayout(page) {
  const configured = props.pageLayouts[page.key] || {}
  return {
    default: configured.default || page.default,
    allow_switch: configured.allow_switch === true,
    columns: Number(configured.columns) || page.columns,
    wide_columns: Number(configured.wide_columns) || page.wideColumns
  }
}

function normalizeColumns(value) {
  const number = Number.parseInt(value, 10)
  return Number.isInteger(number) ? Math.min(Math.max(number, 1), 4) : 1
}

function updatePageLayouts(key, value) {
  emit('update:page-layouts', {
    ...props.pageLayouts,
    [key]: value
  })
}

function updatePageLayout(pageKey, key, value) {
  emit('update:page-layouts', {
    ...props.pageLayouts,
    [pageKey]: {
      ...props.pageLayouts[pageKey],
      [key]: value
    }
  })
}
</script>
