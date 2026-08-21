<template>
  <section id="admin-site-menus" class="admin-menu-editor">
    <section class="admin-menu-section">
      <header class="admin-menu-section-header">
        <div>
          <h2>导航菜单</h2>
          <span>{{ visibleMenuCount }} 项显示中</span>
        </div>
        <label class="admin-menu-limit-control">
          <span>一级菜单上限</span>
          <input
            class="admin-control"
            type="number"
            min="1"
            max="12"
            :value="primaryLimit"
            aria-label="一级菜单上限"
            @change="updatePrimaryLimit($event.target.value)"
          />
        </label>
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
            <code>{{ row.link ? row.target : (row.path || `/${row.key}`) }}</code>
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
            @click="openPageDialog(index, $event)"
          >
            <Pencil aria-hidden="true" />
          </button>

          <button
            type="button"
            class="admin-icon-command admin-menu-enable-command"
            :class="{ active: row.enabled }"
            :aria-label="`${row.enabled ? '停用' : '启用'}${getRowLabel(row)}`"
            :title="row.enabled ? '停用菜单项' : '启用菜单项'"
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
          <h2>自定义页面与链接</h2>
          <span>{{ customItems.length }} 项</span>
        </div>
        <button type="button" class="admin-command" @click="openPageDialog(-1, $event)">
          <Plus aria-hidden="true" />
          新增菜单项
        </button>
      </header>

      <div v-if="customItems.length > 0" class="admin-custom-page-list">
        <article
          v-for="entry in customItems"
          :key="`custom-page-${entry.index}`"
          class="admin-custom-page-item"
        >
          <div class="admin-custom-page-icon" aria-hidden="true">
            <Link v-if="entry.row.link" />
            <Users v-else-if="entry.row.component === 'friends'" />
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
            title="编辑"
            @click="openPageDialog(entry.index, $event)"
          >
            <Pencil aria-hidden="true" />
          </button>
          <button
            type="button"
            class="admin-icon-command admin-icon-command-danger"
            :aria-label="`删除${getRowLabel(entry.row)}`"
            title="删除"
            @click="removePage(entry.index)"
          >
            <Trash2 aria-hidden="true" />
          </button>
        </article>
      </div>
      <p v-else class="admin-field-empty">暂无自定义页面或链接</p>
    </section>

    <div
      v-if="pageDialogOpen"
      class="admin-modal-backdrop"
      @click.self="closePageDialog"
      @keydown.esc="closePageDialog"
      @keydown.tab="trapDialogFocus"
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
              {{ dialogTitle }}
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
            <div class="admin-page-kind-control" role="group" aria-label="新增类型">
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
              <span>{{ pageDraft.kind === 'link' ? '菜单名称' : '页面名称' }}</span>
              <input
                v-model="pageDraft.title"
                data-page-name
                class="admin-control"
                type="text"
                :placeholder="pageDraft.kind === 'link' ? 'GitHub' : '关于'"
              />
            </label>

            <label class="admin-page-dialog-field">
              <span>导航位置</span>
              <select
                v-model="pageDraft.menu_group"
                data-menu-position
                class="admin-control"
              >
                <option value="primary">一级菜单</option>
                <option value="auto">自动安排</option>
                <option value="more">更多菜单</option>
              </select>
              <small>{{ draftMenuPositionHint }}</small>
            </label>

            <template v-if="pageDraft.kind === 'context'">
              <div class="admin-page-source-control" role="group" aria-label="内容来源">
                <button
                  type="button"
                  :class="{ active: pageDraft.sourceMode === 'file' }"
                  :aria-pressed="pageDraft.sourceMode === 'file'"
                  @click="pageDraft.sourceMode = 'file'"
                >
                  已有 Markdown
                </button>
                <button
                  type="button"
                  :class="{ active: pageDraft.sourceMode === 'inline' }"
                  :aria-pressed="pageDraft.sourceMode === 'inline'"
                  @click="pageDraft.sourceMode = 'inline'"
                >
                  直接填写
                </button>
              </div>

              <label v-if="pageDraft.sourceMode === 'file'" class="admin-page-dialog-field">
                <span>内容文件</span>
                <select v-model="pageDraft.file" data-content-file class="admin-control">
                  <option value="">请选择仓库中的 Markdown 文件</option>
                  <option
                    v-if="pageDraft.file && !availableContentFiles.includes(pageDraft.file)"
                    :value="pageDraft.file"
                    disabled
                  >
                    当前文件不存在：{{ pageDraft.file }}
                  </option>
                  <option v-for="file in availableContentFiles" :key="file" :value="file">
                    {{ file }}
                  </option>
                </select>
                <small v-if="availableContentFiles.length === 0">仓库中暂无可用 Markdown 文件</small>
              </label>

              <label v-else class="admin-page-dialog-field admin-page-content-field">
                <span>页面正文</span>
                <textarea
                  v-model="pageDraft.content"
                  class="admin-control"
                  rows="8"
                  placeholder="支持 Markdown，可直接填写页面内容。"
                />
              </label>
            </template>

            <template v-else-if="pageDraft.kind === 'collection'">
              <label class="admin-page-dialog-field">
                <span>内容目录</span>
                <select v-model="pageDraft.folder" class="admin-control">
                  <option value="">请选择包含 Markdown 的目录</option>
                  <option
                    v-if="pageDraft.folder && !availableContentFolders.includes(pageDraft.folder)"
                    :value="pageDraft.folder"
                    disabled
                  >
                    当前目录不存在：{{ pageDraft.folder }}
                  </option>
                  <option v-for="folder in availableContentFolders" :key="folder" :value="folder">
                    {{ folder }}
                  </option>
                </select>
                <small v-if="availableContentFolders.length === 0">仓库中暂无可用内容目录</small>
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

            <label v-else-if="pageDraft.kind === 'link'" class="admin-page-dialog-field">
              <span>链接地址</span>
              <input
                v-model="pageDraft.target"
                class="admin-control"
                type="url"
                placeholder="https://github.com/username"
              />
              <small>支持站内路径、HTTP(S)、邮箱和电话链接</small>
            </label>

            <label v-if="pageDraft.kind !== 'link'" class="admin-page-dialog-field">
              <span>访问地址</span>
              <input
                v-model="pageDraft.path"
                class="admin-control"
                type="text"
                :placeholder="`/${resolvedDraftKey}`"
              />
              <small :class="{ 'admin-page-field-warning': draftNeedsCustomPath }">
                {{ draftPathHint }}
              </small>
            </label>
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
                <span>项目标识</span>
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
              <label v-if="!pageDraft.builtIn && pageDraft.kind !== 'link'" class="admin-page-dialog-field">
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
              <label class="admin-page-dialog-field admin-page-description-field">
                <span>{{ pageDraft.kind === 'link' ? '链接说明' : '页面说明' }}</span>
                <textarea v-model="pageDraft.description" class="admin-control" rows="3" />
              </label>
            </div>
          </details>

          <p v-if="showDraftError && draftError" class="admin-page-dialog-error" role="alert">
            {{ draftError }}
          </p>
        </div>

        <footer>
          <button type="button" class="admin-command" @click="closePageDialog">取消</button>
          <button type="button" class="admin-command admin-command-primary" @click="savePage">
            <Save aria-hidden="true" />
            保存
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
  Link,
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
  normalizeMenuLinkTarget,
  normalizeMenuContentPath,
  normalizeMenuPagePath
} from '../../../framework/utils/menuRouteConfig.js'
import { getMenuConfigDiagnostics } from '../../../framework/utils/menuConfig.js'
import {
  createAdminMenuLink,
  createAdminMenuPage,
  createAdminMenuRows,
  deriveAdminMenuPageKey,
  getAdminMenuPreview,
  moveAdminMenuRow,
  serializeAdminMenuLinks,
  serializeAdminMenuRows
} from '../adminMenuModel.js'

const props = defineProps({
  pages: {
    type: Array,
    default: () => []
  },
  links: {
    type: Array,
    default: () => []
  },
  contentSources: {
    type: Object,
    default: () => ({ files: [], folders: [] })
  },
  routePatterns: {
    type: Object,
    default: () => ({})
  },
  primaryLimit: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['update:links', 'update:pages', 'update:primary-limit'])
const collectionComponents = new Set(['list', 'card', 'grid', 'timeline'])
const pageKinds = Object.freeze([
  { key: 'context', label: '单篇内容', icon: FileText },
  { key: 'collection', label: '内容目录', icon: FolderOpen },
  { key: 'friends', label: '友情链接', icon: Users },
  { key: 'link', label: '导航链接', icon: Link }
])
const rows = computed(() => createAdminMenuRows(props.pages, props.links))
const preview = computed(() => getAdminMenuPreview(rows.value, props.primaryLimit))
const visibleMenuCount = computed(() => (
  rows.value.filter(row => row.enabled !== false && row.visible !== false).length
))
const customItems = computed(() => rows.value
  .map((row, index) => ({ row, index }))
  .filter(entry => !entry.row.builtIn))
const availableContentFiles = computed(() => (
  Array.isArray(props.contentSources?.files) ? props.contentSources.files : []
))
const availableContentFolders = computed(() => (
  Array.isArray(props.contentSources?.folders) ? props.contentSources.folders : []
))
const pageDialogOpen = ref(false)
const pageDialogRef = ref(null)
const dialogTrigger = ref(null)
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
const resolvedDraftPath = computed(() => (
  normalizeMenuPagePath(pageDraft.value.path, `/${resolvedDraftKey.value}`)
))
const draftNeedsCustomPath = computed(() => (
  !pageDraft.value.builtIn
  && pageDraft.value.kind !== 'link'
  && draftKeyAutomatic.value
  && /^page(?:-\d+)?$/u.test(resolvedDraftKey.value)
  && !String(pageDraft.value.path || '').trim()
))
const draftPathHint = computed(() => (
  draftNeedsCustomPath.value
    ? '中文名称无法自动生成清晰地址，请填写简短英文地址，例如 /about。'
    : `保存后的访问地址：${resolvedDraftPath.value || '尚未生成'}`
))
const draftMenuPositionHint = computed(() => {
  if (pageDraft.value.menu_group === 'more') {
    return '收进“更多”，避免顶部导航过长。'
  }
  if (pageDraft.value.menu_group === 'auto') {
    return `根据一级菜单上限自动安排，当前上限为 ${props.primaryLimit} 项。`
  }
  return '固定为一级菜单；空间不足时，靠后的“自动”菜单会移入“更多”。'
})
const dialogTitle = computed(() => {
  if (pageDraft.value.builtIn) return '编辑内置页面'
  const type = pageDraft.value.kind === 'link' ? '链接' : '页面'
  return editingIndex.value >= 0 ? `编辑${type}` : `新增${type}`
})

const draftError = computed(() => {
  const draft = pageDraft.value
  if (draft.builtIn) {
    return String(draft.label || '').trim() ? '' : '请填写菜单名称。'
  }
  if (!String(draft.title || '').trim()) {
    return draft.kind === 'link' ? '请填写菜单名称。' : '请填写页面名称。'
  }

  const component = getDraftComponent(draft)
  if (component === 'link') {
    if (!normalizeMenuLinkTarget(draft.target)) return '请填写有效的链接地址。'
  } else if (component === 'context' && draft.sourceMode === 'inline') {
    if (!String(draft.content || '').trim()) return '请填写页面正文。'
  } else if (component === 'context') {
    const file = normalizeMenuContentPath(draft.file, 'file')
    if (!file || !availableContentFiles.value.includes(file)) {
      return '请选择仓库中真实存在的内容文件。'
    }
  }
  if (collectionComponents.has(component)) {
    const folder = normalizeMenuContentPath(draft.folder, 'folder')
    if (!folder || !availableContentFolders.value.includes(folder)) {
      return '请选择包含 Markdown 文件的内容目录。'
    }
  }
  if (draftNeedsCustomPath.value) return '请填写清晰的英文访问地址。'
  if (!isValidMenuPageKey(resolvedDraftKey.value)) return '页面标识格式不正确。'
  if (rows.value.some((row, index) => (
    index !== editingIndex.value && row.key === resolvedDraftKey.value
  ))) {
    return '页面标识已经存在。'
  }
  if (draft.path && !normalizeMenuPagePath(draft.path, '')) {
    return '自定义路径格式不正确。'
  }
  return getDraftRouteError()
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
    sourceMode: 'file',
    content: '',
    file: '',
    folder: '',
    path: '',
    target: '',
    menu_group: 'primary'
  }
}

function getPageKind(row) {
  if (row.link) return 'link'
  if (row.component === 'friends') return 'friends'
  if (collectionComponents.has(row.component)) return 'collection'
  return 'context'
}

function getDraftComponent(draft) {
  if (draft.kind === 'link') return 'link'
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
  if (row.link) return `导航链接 · ${row.target}`
  const pagePath = row.path || `/${row.key}`
  if (row.component === 'friends') return `友情链接 · ${pagePath}`
  if (collectionComponents.has(row.component)) {
    return `${row.folder || '未设置目录'} · ${pagePath}`
  }
  return `${row.content && !row.file ? '内嵌内容' : (row.file || '未设置文件')} · ${pagePath}`
}

function emitRows(nextRows) {
  emit('update:pages', serializeAdminMenuRows(nextRows))
  emit('update:links', serializeAdminMenuLinks(nextRows))
}

function updateRow(index, key, value) {
  const nextRows = rows.value.map(row => ({ ...row }))
  nextRows[index][key] = value
  emitRows(nextRows)
}

function movePage(index, direction) {
  emitRows(moveAdminMenuRow(rows.value, index, direction))
}

function updatePrimaryLimit(value) {
  const parsed = Number.parseInt(value, 10)
  const nextValue = Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), 12) : 5
  emit('update:primary-limit', nextValue)
}

function setPageKind(kind) {
  pageDraft.value.kind = kind
  if (kind === 'collection' && !collectionComponents.has(pageDraft.value.component)) {
    pageDraft.value.component = 'grid'
  }
}

function openPageDialog(index = -1, event = null) {
  editingIndex.value = index
  showDraftError.value = false
  dialogTrigger.value = event?.currentTarget || document.activeElement

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
      sourceMode: row.content && !row.file ? 'inline' : 'file',
      content: row.content,
      file: row.file,
      folder: row.folder,
      path: row.path,
      target: row.target,
      menu_group: row.menu_group
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
  const trigger = dialogTrigger.value
  dialogTrigger.value = null
  nextTick(() => trigger?.isConnected && trigger.focus())
}

function getFocusableElements() {
  if (!pageDialogRef.value) return []
  return Array.from(pageDialogRef.value.querySelectorAll(
    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])'
  )).filter(element => (
    !element.hidden
    && (element.tagName === 'SUMMARY' || !element.closest('details:not([open])'))
  ))
}

function trapDialogFocus(event) {
  const focusable = getFocusableElements()
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable.at(-1)

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function setDraftKey(value) {
  draftKeyAutomatic.value = false
  pageDraft.value.key = value
}

function resetDraftKey() {
  draftKeyAutomatic.value = true
  pageDraft.value.key = ''
}

function createDraftRows() {
  const nextRows = rows.value.map(row => ({ ...row }))
  const draft = pageDraft.value
  if (draft.builtIn) {
    const row = nextRows[editingIndex.value]
    row.label = String(draft.label || '').trim()
    row.title = String(draft.title || '').trim()
    row.description = String(draft.description || '').trim()
  } else if (draft.kind === 'link') {
    const row = editingIndex.value >= 0
      ? nextRows[editingIndex.value]
      : createAdminMenuLink(nextRows)
    Object.assign(row, {
      key: resolvedDraftKey.value,
      label: String(draft.title || '').trim(),
      title: String(draft.title || '').trim(),
      description: String(draft.description || '').trim(),
      target: normalizeMenuLinkTarget(draft.target),
      component: 'link',
      link: true,
      menu_group: draft.menu_group
    })
    if (editingIndex.value < 0) nextRows.push(row)
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
      content: component === 'context' && draft.sourceMode === 'inline'
        ? String(draft.content || '').trim()
        : '',
      file: component === 'context' && draft.sourceMode === 'file'
        ? normalizeMenuContentPath(draft.file, 'file')
        : '',
      folder: collectionComponents.has(component)
        ? normalizeMenuContentPath(draft.folder, 'folder')
        : '',
      path: draft.path ? normalizeMenuPagePath(draft.path, '') : '',
      menu_group: draft.menu_group
    })
    if (editingIndex.value < 0) nextRows.push(row)
  }

  return nextRows
}

function getDraftRouteError() {
  if (pageDraft.value.builtIn || pageDraft.value.kind === 'link') return ''
  const diagnostics = getMenuConfigDiagnostics({
    pages: serializeAdminMenuRows(createDraftRows())
  }, props.routePatterns)
  const conflict = diagnostics.find(diagnostic => (
    diagnostic.level === 'error'
    && ['duplicate-menu-page-path', 'conflicting-menu-page-route'].includes(diagnostic.code)
  ))

  if (conflict?.code === 'duplicate-menu-page-path') return '访问地址已被其他页面使用。'
  if (conflict) return '访问地址与站点现有路由冲突，请更换。'
  return ''
}

function savePage() {
  showDraftError.value = true
  if (draftError.value) return

  emitRows(createDraftRows())
  closePageDialog()
}

function removePage(index) {
  const row = rows.value[index]
  if (!window.confirm(`确定删除“${getRowLabel(row)}”吗？`)) return
  emitRows(rows.value.filter((_, rowIndex) => rowIndex !== index))
}
</script>
