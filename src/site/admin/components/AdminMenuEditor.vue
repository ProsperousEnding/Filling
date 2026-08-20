<template>
  <section class="admin-menu-editor">
    <header class="admin-menu-editor-header">
      <h2>菜单与页面</h2>
      <button
        type="button"
        class="admin-icon-command"
        title="新增页面"
        aria-label="新增页面"
        @click="addPage"
      >
        <Plus aria-hidden="true" />
      </button>
    </header>

    <div class="admin-menu-preview" aria-label="桌面菜单预览">
      <div>
        <span>一级菜单</span>
        <ul>
          <li v-for="row in preview.primary" :key="row.key">
            {{ getRowLabel(row) }}
          </li>
          <li v-if="preview.primary.length === 0">无</li>
        </ul>
      </div>
      <div>
        <span>更多</span>
        <ul>
          <li v-for="row in preview.overflow" :key="row.key">
            {{ getRowLabel(row) }}
          </li>
          <li v-if="preview.overflow.length === 0">无</li>
        </ul>
      </div>
    </div>

    <div class="admin-menu-page-list">
      <article v-for="(row, index) in rows" :key="`${row.builtIn ? 'built-in' : 'custom'}-${row.key}-${index}`" class="admin-menu-page">
        <div class="admin-menu-page-summary">
          <div class="admin-menu-order-controls">
            <button
              type="button"
              class="admin-icon-command"
              :disabled="index === 0"
              :aria-label="`上移${getRowLabel(row)}`"
              title="上移"
              @click="movePage(index, -1)"
            >
              <ArrowUp aria-hidden="true" />
            </button>
            <button
              type="button"
              class="admin-icon-command"
              :disabled="index === rows.length - 1"
              :aria-label="`下移${getRowLabel(row)}`"
              title="下移"
              @click="movePage(index, 1)"
            >
              <ArrowDown aria-hidden="true" />
            </button>
          </div>

          <div class="admin-menu-page-identity">
            <strong>{{ getRowLabel(row) }}</strong>
            <code>{{ row.key || 'new-page' }}</code>
          </div>

          <select
            class="admin-control admin-menu-group-select"
            :value="row.menu_group"
            :aria-label="`${getRowLabel(row)}菜单位置`"
            @change="updateRow(index, 'menu_group', $event.target.value)"
          >
            <option value="auto">自动</option>
            <option value="primary">一级菜单</option>
            <option value="more">更多</option>
          </select>

          <label class="admin-menu-check">
            <input
              type="checkbox"
              :checked="row.visible"
              :disabled="!row.enabled"
              @change="updateRow(index, 'visible', $event.target.checked)"
            />
            菜单可见
          </label>
          <label class="admin-menu-check">
            <input
              type="checkbox"
              :checked="row.enabled"
              @change="updateRow(index, 'enabled', $event.target.checked)"
            />
            页面启用
          </label>

          <button
            v-if="!row.builtIn"
            type="button"
            class="admin-icon-command admin-icon-command-danger"
            :aria-label="`删除${getRowLabel(row)}`"
            title="删除页面"
            @click="removePage(index)"
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>

        <details class="admin-menu-page-details">
          <summary>页面设置</summary>
          <div class="admin-menu-page-fields">
            <label v-if="!row.builtIn">
              <span>页面标识</span>
              <input
                class="admin-control"
                type="text"
                :value="row.key"
                placeholder="about"
                @input="updateRow(index, 'key', $event.target.value)"
              />
            </label>
            <label>
              <span>菜单名称</span>
              <input
                class="admin-control"
                type="text"
                :value="row.label"
                :placeholder="row.title"
                @input="updateRow(index, 'label', $event.target.value)"
              />
            </label>
            <label>
              <span>页面标题</span>
              <input
                class="admin-control"
                type="text"
                :value="row.title"
                @input="updateRow(index, 'title', $event.target.value)"
              />
            </label>
            <label v-if="!row.builtIn">
              <span>页面类型</span>
              <select
                class="admin-control"
                :value="row.component"
                @change="updateComponent(index, $event.target.value)"
              >
                <option value="context">单篇内容</option>
                <option value="list">列表</option>
                <option value="card">卡片</option>
                <option value="grid">网格</option>
                <option value="timeline">时间线</option>
                <option value="friends">友情链接</option>
              </select>
            </label>
            <label v-if="!row.builtIn && row.component === 'context'">
              <span>内容文件</span>
              <input
                class="admin-control"
                type="text"
                :value="row.file"
                placeholder="about.md"
                @input="updateRow(index, 'file', $event.target.value)"
              />
            </label>
            <label v-if="!row.builtIn && collectionComponents.has(row.component)">
              <span>内容目录</span>
              <input
                class="admin-control"
                type="text"
                :value="row.folder"
                placeholder="projects"
                @input="updateRow(index, 'folder', $event.target.value)"
              />
            </label>
            <label v-if="!row.builtIn">
              <span>页面路径</span>
              <input
                class="admin-control"
                type="text"
                :value="row.path"
                :placeholder="row.key ? `/${row.key}` : '/page'"
                @input="updateRow(index, 'path', $event.target.value)"
              />
            </label>
            <label class="admin-menu-description-field">
              <span>页面说明</span>
              <textarea
                class="admin-control"
                :value="row.description"
                rows="2"
                @input="updateRow(index, 'description', $event.target.value)"
              />
            </label>
          </div>
        </details>
      </article>
    </div>
  </section>
</template>

<script setup>
import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/vue'
import { computed } from 'vue'

import {
  createAdminMenuPage,
  createAdminMenuRows,
  getAdminMenuPreview,
  moveAdminMenuRow,
  serializeAdminMenuRows
} from '../adminMenuModel.js'

const props = defineProps({
  pages: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:pages'])
const collectionComponents = new Set(['list', 'card', 'grid', 'timeline'])
const rows = computed(() => createAdminMenuRows(props.pages))
const preview = computed(() => getAdminMenuPreview(rows.value))

function emitRows(nextRows) {
  emit('update:pages', serializeAdminMenuRows(nextRows))
}

function getRowLabel(row) {
  return row.label || row.title || row.key || '新页面'
}

function updateRow(index, key, value) {
  const nextRows = rows.value.map(row => ({ ...row }))
  nextRows[index][key] = value
  emitRows(nextRows)
}

function updateComponent(index, component) {
  const nextRows = rows.value.map(row => ({ ...row }))
  nextRows[index].component = component
  if (component !== 'context') nextRows[index].file = ''
  if (!collectionComponents.has(component)) nextRows[index].folder = ''
  emitRows(nextRows)
}

function movePage(index, direction) {
  emitRows(moveAdminMenuRow(rows.value, index, direction))
}

function addPage() {
  emitRows([...rows.value, createAdminMenuPage(rows.value)])
}

function removePage(index) {
  emitRows(rows.value.filter((_, rowIndex) => rowIndex !== index))
}
</script>
