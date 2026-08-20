<template>
  <section class="admin-menu-editor">
    <section class="admin-menu-section">
      <header class="admin-menu-section-header">
        <div>
          <h2>导航菜单</h2>
          <span>{{ visibleMenuCount }} 项显示中</span>
        </div>
      </header>

      <div class="admin-menu-preview" aria-label="桌面菜单预览">
        <div>
          <span>一级菜单</span>
          <ul>
            <li
              v-for="(row, index) in preview.primary"
              :key="getRowRenderKey(row, index, 'primary')"
            >
              {{ getRowLabel(row) }}
            </li>
            <li v-if="preview.primary.length === 0">无</li>
          </ul>
        </div>
        <div>
          <span>更多</span>
          <ul>
            <li
              v-for="(row, index) in preview.overflow"
              :key="getRowRenderKey(row, index, 'overflow')"
            >
              {{ getRowLabel(row) }}
            </li>
            <li v-if="preview.overflow.length === 0">无</li>
          </ul>
        </div>
      </div>

      <div class="admin-menu-navigation-list">
        <div
          v-for="(row, index) in rows"
          :key="getRowRenderKey(row, index, 'navigation')"
          class="admin-menu-navigation-row"
          :class="{ 'admin-menu-navigation-row-disabled': !row.enabled }"
        >
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
            <code>{{ row.path || `/${row.key}` }}</code>
          </div>

          <select
            class="admin-control admin-menu-group-select"
            :value="row.menu_group"
            :disabled="!row.enabled"
            :aria-label="`${getRowLabel(row)}菜单位置`"
            @change="updateRow(index, 'menu_group', $event.target.value)"
          >
            <option value="auto">自动</option>
            <option value="primary">一级菜单</option>
            <option value="more">更多</option>
          </select>

          <button
            type="button"
            class="admin-toggle admin-menu-visibility-toggle"
            :class="{ 'admin-toggle-active': row.visible && row.enabled }"
            role="switch"
            :aria-checked="row.visible && row.enabled"
            :disabled="!row.enabled"
            :aria-label="`${getRowLabel(row)}在菜单中显示`"
            :title="row.visible ? '从菜单隐藏' : '显示在菜单'"
            @click="updateRow(index, 'visible', !row.visible)"
          >
            <span aria-hidden="true" />
          </button>

          <button
            v-if="row.builtIn"
            type="button"
            class="admin-icon-command"
            :aria-label="`编辑${getRowLabel(row)}`"
            title="编辑名称"
            @click="openPageDialog(index)"
          >
            <Pencil aria-hidden="true" />
          </button>

          <button
            type="button"
            class="admin-icon-command admin-menu-enable-command"
            :class="{ active: row.enabled }"
            :aria-label="`${row.enabled ? '停用' : '启用'}${getRowLabel(row)}`"
            :title="row.enabled ? '停用页面' : '启用页面'"
            @click="updateRow(index, 'enabled', !row.enabled)"
          >
            <Power aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>

    <section class="admin-menu-section admin-custom-pages-section">
      <header class="admin-menu-section-header">
        <div>
          <h2>自定义页面</h2>
          <span>{{ customPages.length }} 个页面</span>
        </div>
        <button type="button" class="admin-command" @click="openPageDialog()">
          <Plus aria-hidden="true" />
          新增页面
        </button>
      </header>

      <div v-if="customPages.length > 0" class="admin-custom-page-list">
        <article
          v-for="entry in customPages"
          :key="`custom-page-${entry.index}`"
          class="admin-custom-page-item"
        >
          <div class="admin-custom-page-icon" aria-hidden="true">
            <Users v-if="entry.row.component === 'friends'" />
            <FolderOpen v-else-if="collectionComponents.has(entry.row.component)" />
            <FileText v-else />
          </div>
          <div class="admin-custom-page-copy">
            <strong>{{ entry.row.title || entry.row.label || entry.row.key }}</strong>
            <span>{{ getCustomPageMeta(entry.row) }}</span>
          </div>
          <button
            type="button"
            class="admin-icon-command"
            :aria-label="`编辑${getRowLabel(entry.row)}`"
            title="编辑页面"
            @click="openPageDialog(entry.index)"
          >
            <Pencil aria-hidden="true" />
          </button>
          <button
            type="button"
            class="admin-icon-command admin-icon-command-danger"
            :aria-label="`删除${getRowLabel(entry.row)}`"
            title="删除页面"
            @click="removePage(entry.index)"
          >
            <Trash2 aria-hidden="true" />
          </button>
        </article>
      </div>
      <p v-else class="admin-field-empty">暂无自定义页面</p>
    </section>

    <div
      v-if="pageDialogOpen"
      class="admin-modal-backdrop"
      @click.self="closePageDialog"
      @keydown.esc="closePageDialog"
    >
      <section
        ref="pageDialogRef"
        class="admin-modal admin-page-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-page-dialog-title"
      >
        <header>
          <div>
            <h2 id="admin-page-dialog-title">
              {{ pageDraft.builtIn ? '编辑内置页面' : editingIndex >= 0 ? '编辑页面' : '新增页面' }}
            </h2>
            <p v-if="pageDraft.builtIn">{{ pageDraft.path }}</p>
          </div>
          <button
            type="button"
            class="admin-icon-command"
            title="关闭"
            aria-label="关闭"
            @click="closePageDialog"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div class="admin-page-dialog-body">
          <template v-if="!pageDraft.builtIn">
            <div class="admin-page-kind-control" role="group" aria-label="页面类型">
              <button
                v-for="kind in pageKinds"
                :key="kind.key"
                type="button"
                :class="{ active: pageDraft.kind === kind.key }"
                :aria-pressed="pageDraft.kind === kind.key"
                @click="setPageKind(kind.key)"
              >
                <component :is="kind.icon" aria-hidden="true" />
                {{ kind.label }}
              </button>
            </div>

            <label class="admin-page-dialog-field">
              <span>页面名称</span>
              <input
                v-model="pageDraft.title"
                data-page-name
                class="admin-control"
                type="text"
                placeholder="关于"
              />
            </label>

            <label v-if="pageDraft.kind === 'context'" class="admin-page-dialog-field">
              <span>内容文件</span>
              <input
                v-model="pageDraft.file"
                class="admin-control"
                type="text"
                placeholder="about.md"
              />
            </label>

            <template v-else-if="pageDraft.kind === 'collection'">
              <label class="admin-page-dialog-field">
                <span>内容目录</span>
                <input
                  v-model="pageDraft.folder"
                  class="admin-control"
                  type="text"
                  placeholder="projects"
                />
              </label>
              <label class="admin-page-dialog-field">
                <span>展示方式</span>
                <select v-model="pageDraft.component" class="admin-control">
                  <option value="list">列表</option>
                  <option value="card">卡片</option>
                  <option value="grid">网格</option>
                  <option value="timeline">时间线</option>
                </select>
              </label>
            </template>
          </template>

          <label v-else class="admin-page-dialog-field">
            <span>菜单名称</span>
            <input
              v-model="pageDraft.label"
              data-page-name
              class="admin-control"
              type="text"
            />
          </label>

          <details class="admin-page-dialog-advanced">
            <summary>高级设置</summary>
            <div class="admin-page-dialog-advanced-fields">
              <label v-if="!pageDraft.builtIn" class="admin-page-dialog-field">
                <span>页面标识</span>
                <div class="admin-page-key-control">
                  <input
                    class="admin-control"
                    type="text"
                    :value="resolvedDraftKey"
                    @input="setDraftKey($event.target.value)"
                  />
                  <button
                    type="button"
                    class="admin-icon-command"
                    title="自动生成"
                    aria-label="自动生成页面标识"
                    @click="resetDraftKey"
                  >
                    <RotateCcw aria-hidden="true" />
                  </button>
                </div>
              </label>
              <label v-if="!pageDraft.builtIn" class="admin-page-dialog-field">
                <span>独立菜单名称</span>
                <input
                  v-model="pageDraft.label"
                  class="admin-control"
                  type="text"
                  :placeholder="pageDraft.title"
                />
              </label>
              <label v-if="pageDraft.builtIn" class="admin-page-dialog-field">
                <span>页面标题</span>
                <input v-model="pageDraft.title" class="admin-control" type="text" />
              </label>
              <label v-if="!pageDraft.builtIn" class="admin-page-dialog-field">
                <span>自定义路径</span>
                <input
                  v-model="pageDraft.path"
                  class="admin-control"
                  type="text"
                  :placeholder="`/${resolvedDraftKey}`"
                />
              </label>
              <label class="admin-page-dialog-field admin-page-description-field">
                <span>页面说明</span>
                <textarea v-model="pageDraft.description" class="admin-control" rows="3" />
              </label>
            </div>
          </details>

          <p v-if="showDraftError && draftError" class="admin-page-dialog-error">
            {{ draftError }}
          </p>
        </div>

        <footer>
          <button type="button" class="admin-command" @click="closePageDialog">取消</button>
          <button type="button" class="admin-command admin-command-primary" @click="savePage">
            <Save aria-hidden="true" />
            保存页面
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>

<script setup>
import {
  ArrowDown,
  ArrowUp,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Save,
  Trash2,
  Users,
  X
} from '@lucide/vue'
import { computed, nextTick, ref } from 'vue'

import {
  isValidMenuPageKey,
  normalizeMenuContentPath,
  normalizeMenuPagePath
} from '../../../framework/utils/menuRouteConfig.js'
import {
  createAdminMenuPage,
  createAdminMenuRows,
  deriveAdminMenuPageKey,
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
const pageKinds = Object.freeze([
  { key: 'context', label: '单篇内容', icon: FileText },
  { key: 'collection', label: '内容目录', icon: FolderOpen },
  { key: 'friends', label: '友情链接', icon: Users }
])
const rows = computed(() => createAdminMenuRows(props.pages))
const preview = computed(() => getAdminMenuPreview(rows.value))
const visibleMenuCount = computed(() => (
  rows.value.filter(row => row.enabled !== false && row.visible !== false).length
))
const customPages = computed(() => rows.value
  .map((row, index) => ({ row, index }))
  .filter(entry => !entry.row.builtIn))
const pageDialogOpen = ref(false)
const pageDialogRef = ref(null)
const editingIndex = ref(-1)
const editingOriginalKey = ref('')
const draftKeyAutomatic = ref(true)
const showDraftError = ref(false)
const pageDraft = ref(createEmptyDraft())

const resolvedDraftKey = computed(() => (
  draftKeyAutomatic.value
    ? deriveAdminMenuPageKey(
      {
        ...pageDraft.value,
        component: getDraftComponent(pageDraft.value)
      },
      rows.value,
      editingOriginalKey.value
    )
    : String(pageDraft.value.key || '').trim().toLowerCase()
))

const draftError = computed(() => {
  const draft = pageDraft.value
  if (draft.builtIn) {
    return String(draft.label || '').trim() ? '' : '请填写菜单名称。'
  }
  if (!String(draft.title || '').trim()) return '请填写页面名称。'

  const component = getDraftComponent(draft)
  if (component === 'context' && !normalizeMenuContentPath(draft.file, 'file')) {
    return '请填写有效的内容文件。'
  }
  if (collectionComponents.has(component) && !normalizeMenuContentPath(draft.folder, 'folder')) {
    return '请填写有效的内容目录。'
  }
  if (!isValidMenuPageKey(resolvedDraftKey.value)) return '页面标识格式不正确。'
  if (rows.value.some((row, index) => (
    index !== editingIndex.value && row.key === resolvedDraftKey.value
  ))) {
    return '页面标识已经存在。'
  }
  if (draft.path && !normalizeMenuPagePath(draft.path, '')) {
    return '自定义路径格式不正确。'
  }
  return ''
})

function createEmptyDraft() {
  return {
    builtIn: false,
    kind: 'context',
    key: '',
    label: '',
    title: '',
    description: '',
    component: 'context',
    file: '',
    folder: '',
    path: ''
  }
}

function getPageKind(row) {
  if (row.component === 'friends') return 'friends'
  if (collectionComponents.has(row.component)) return 'collection'
  return 'context'
}

function getDraftComponent(draft) {
  if (draft.kind === 'friends') return 'friends'
  if (draft.kind === 'collection') {
    return collectionComponents.has(draft.component) ? draft.component : 'grid'
  }
  return 'context'
}

function getRowLabel(row) {
  return row.label || row.title || row.key || '新页面'
}

function getRowRenderKey(row, index, scope) {
  return row.builtIn
    ? `${scope}-built-in-${row.key}`
    : `${scope}-custom-${index}`
}

function getCustomPageMeta(row) {
  const pagePath = row.path || `/${row.key}`
  if (row.component === 'friends') return `友情链接 · ${pagePath}`
  if (collectionComponents.has(row.component)) {
    return `${row.folder || '未设置目录'} · ${pagePath}`
  }
  return `${row.file || '未设置文件'} · ${pagePath}`
}

function emitRows(nextRows) {
  emit('update:pages', serializeAdminMenuRows(nextRows))
}

function updateRow(index, key, value) {
  const nextRows = rows.value.map(row => ({ ...row }))
  nextRows[index][key] = value
  emitRows(nextRows)
}

function movePage(index, direction) {
  emitRows(moveAdminMenuRow(rows.value, index, direction))
}

function setPageKind(kind) {
  pageDraft.value.kind = kind
  if (kind === 'collection' && !collectionComponents.has(pageDraft.value.component)) {
    pageDraft.value.component = 'grid'
  }
}

function openPageDialog(index = -1) {
  editingIndex.value = index
  showDraftError.value = false

  if (index >= 0) {
    const row = rows.value[index]
    editingOriginalKey.value = row.key
    draftKeyAutomatic.value = false
    pageDraft.value = {
      builtIn: row.builtIn,
      kind: row.builtIn ? 'built-in' : getPageKind(row),
      key: row.key,
      label: row.label,
      title: row.title,
      description: row.description,
      component: row.component,
      file: row.file,
      folder: row.folder,
      path: row.path
    }
  } else {
    editingOriginalKey.value = ''
    draftKeyAutomatic.value = true
    pageDraft.value = createEmptyDraft()
  }

  pageDialogOpen.value = true
  nextTick(() => pageDialogRef.value?.querySelector('[data-page-name]')?.focus())
}

function closePageDialog() {
  pageDialogOpen.value = false
}

function setDraftKey(value) {
  draftKeyAutomatic.value = false
  pageDraft.value.key = value
}

function resetDraftKey() {
  draftKeyAutomatic.value = true
  pageDraft.value.key = ''
}

function savePage() {
  showDraftError.value = true
  if (draftError.value) return

  const nextRows = rows.value.map(row => ({ ...row }))
  const draft = pageDraft.value
  if (draft.builtIn) {
    const row = nextRows[editingIndex.value]
    row.label = String(draft.label || '').trim()
    row.title = String(draft.title || '').trim()
    row.description = String(draft.description || '').trim()
  } else {
    const row = editingIndex.value >= 0
      ? nextRows[editingIndex.value]
      : createAdminMenuPage(nextRows)
    const component = getDraftComponent(draft)
    Object.assign(row, {
      key: resolvedDraftKey.value,
      label: String(draft.label || '').trim(),
      title: String(draft.title || '').trim(),
      description: String(draft.description || '').trim(),
      component,
      file: component === 'context' ? normalizeMenuContentPath(draft.file, 'file') : '',
      folder: collectionComponents.has(component)
        ? normalizeMenuContentPath(draft.folder, 'folder')
        : '',
      path: draft.path ? normalizeMenuPagePath(draft.path, '') : ''
    })
    if (editingIndex.value < 0) nextRows.push(row)
  }

  emitRows(nextRows)
  closePageDialog()
}

function removePage(index) {
  const row = rows.value[index]
  if (!window.confirm(`确定删除“${getRowLabel(row)}”页面吗？`)) return
  emitRows(rows.value.filter((_, rowIndex) => rowIndex !== index))
}
</script>
