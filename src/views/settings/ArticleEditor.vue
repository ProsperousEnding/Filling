<template>
  <div class="editor-shell" :class="{ 'is-fullscreen': isFullscreen }">
    <header class="editor-header">
      <div class="header-left">
        <button class="ghost-btn" type="button" @click="goToDrafts">返回</button>
        <span class="mode-pill">{{ isEditMode ? '编辑文章' : '新增文章' }}</span>
        <span v-if="isDirty" class="dirty-pill">未保存</span>
      </div>

      <div class="header-center">
        <input
          v-model.trim="form.title"
          type="text"
          class="title-input"
          placeholder="请输入文章标题..."
        />
      </div>

      <div class="header-right">
        <span v-if="savedAt" class="status-text">已保存 {{ savedAt }}</span>
        <button class="ghost-btn" type="button" @click="toggleFullscreen">
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </button>
        <button class="primary-btn" type="button" :disabled="saving || loading" @click="handleSave">
          {{ saving ? '保存中...' : '保存文章' }}
        </button>
      </div>
    </header>

    <div class="editor-body">
      <aside class="meta-panel">
        <h2 class="meta-title">发布设置</h2>

        <div class="meta-grid">
          <label class="field">
            <span>ID（文件名）</span>
            <div class="field-inline">
              <input :value="form.id" type="text" class="field-input" @input="onIdInput" placeholder="example-post" />
              <button class="mini-btn" type="button" @click="fillIdFromTitle">生成</button>
            </div>
          </label>

          <label class="field">
            <span>发布日期</span>
            <input :value="form.date" type="text" class="field-input field-input-readonly" readonly />
          </label>

          <label class="field">
            <span>作者</span>
            <input :value="form.author" type="text" class="field-input field-input-readonly" readonly />
          </label>

          <label class="field">
            <span>分类</span>
            <input v-model.trim="form.category" type="text" class="field-input" placeholder="如：前端" />
          </label>

          <label class="field">
            <span>标签（逗号分隔）</span>
            <input v-model.trim="form.tags" type="text" class="field-input" placeholder="Vue, Markdown, Tips" />
          </label>

          <label class="field">
            <span>封面链接</span>
            <input v-model.trim="form.cover" type="text" class="field-input" placeholder="https://..." />
          </label>

          <label class="field">
            <span>阅读数</span>
            <input :value="form.views" type="text" class="field-input field-input-readonly" readonly />
          </label>

          <label class="field">
            <span>摘要</span>
            <textarea v-model.trim="form.description" class="field-input" rows="3" placeholder="用于列表展示"></textarea>
          </label>
        </div>

        <div class="extra-fields">
          <div class="extra-header">
            <h3>扩展字段（可新增/修改）</h3>
            <button class="mini-btn" type="button" @click="addCustomField">新增字段</button>
          </div>

          <div v-if="form.customFields.length === 0" class="empty-tip">暂无扩展字段</div>

          <div v-else class="field-list">
            <div v-for="(field, index) in form.customFields" :key="`${field.key}-${index}`" class="field-item">
              <input v-model.trim="field.key" type="text" class="field-input" placeholder="key" />
              <input v-model.trim="field.value" type="text" class="field-input" placeholder="value" />
              <button class="mini-btn danger" type="button" @click="removeCustomField(index)">删除</button>
            </div>
          </div>
        </div>
      </aside>

      <section class="write-panel">
        <div class="panel-head">
          <div class="head-left">
            <h2>Markdown 编辑器</h2>
            <span class="head-note">Powered by Vditor</span>
          </div>

          <div class="head-actions">
            <button class="mini-btn" type="button" @click="insertTemplate(tableSnippet)">插入表格</button>
            <button class="mini-btn" type="button" @click="insertTemplate(codeSnippet)">插入代码块</button>
          </div>
        </div>

        <div v-if="errorMessage" class="status-error">{{ errorMessage }}</div>
        <div v-if="successMessage" class="status-success">{{ successMessage }}</div>

        <div class="editor-wrap">
          <div :id="editorId" class="vditor-host"></div>
        </div>

        <footer class="bottom-row">
          <div class="stats">
            <span>字数 {{ wordCount }}</span>
            <span>预计阅读 {{ readingMinutes }} 分钟</span>
            <span v-if="autosavedAt">自动保存 {{ autosavedAt }}</span>
          </div>

          <div class="actions">
            <button v-if="hasLocalDraft" class="ghost-btn" type="button" @click="restoreLocalDraft">恢复本地草稿</button>
            <button v-if="hasLocalDraft" class="ghost-btn" type="button" @click="clearLocalDraft">清除草稿</button>
          </div>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import fm from 'front-matter'
import MarkdownIt from 'markdown-it'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { readEditableArticle, saveEditableArticle } from '../../api/articleEditor'
import { useConfigStore } from '../../stores/config'

const router = useRouter()
const route = useRoute()
const configStore = useConfigStore()

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

const tableSnippet = '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容1 | 内容2 | 内容3 |\n'
const codeSnippet = '\n```js\nconsole.log("hello")\n```\n'
const editorId = 'article-vditor'

const loading = ref(false)
const saving = ref(false)
const isFullscreen = ref(false)
const isDirty = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const savedAt = ref('')
const autosavedAt = ref('')
const hasLocalDraft = ref(false)
const originalId = ref('')
const idTouched = ref(false)
const pauseAutosave = ref(false)
const editorReady = ref(false)
const suppressEditorInput = ref(false)

let autosaveTimer = null
let editor = null

const isEditMode = computed(() => route.name === 'ArticleEditorEdit')

const form = reactive({
  title: '',
  id: '',
  date: '',
  author: '',
  category: '',
  tags: '',
  cover: '',
  description: '',
  views: 0,
  content: '',
  customFields: []
})

const defaultAuthor = computed(() => {
  const profile = configStore.userProfile || {}
  return String(profile.displayName || profile.username || '').trim()
})

const ensureAutoMeta = () => {
  if (!form.date) form.date = todayDate()
  if (!String(form.author || '').trim()) form.author = defaultAuthor.value
}

const localDraftKey = computed(() => {
  if (isEditMode.value) {
    return `article-editor-local:edit:${String(route.params.id || 'unknown')}`
  }
  return 'article-editor-local:create'
})

const wordCount = computed(() => {
  const plain = markdown.render(form.content || '').replace(/<[^>]+>/g, ' ').trim()
  if (!plain) return 0
  const chinese = (plain.match(/[\u4e00-\u9fa5]/g) || []).length
  const latin = plain.replace(/[\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(Boolean).length
  return chinese + latin
})

const readingMinutes = computed(() => Math.max(1, Math.ceil(wordCount.value / 300)))

const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const normalizeDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const todayDate = () => new Date().toISOString().slice(0, 10)

const slugify = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const splitTags = (value) => {
  if (!value) return []
  return String(value)
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
}

const setFormDefaults = () => {
  form.title = ''
  form.id = ''
  form.date = todayDate()
  form.author = defaultAuthor.value
  form.category = ''
  form.tags = ''
  form.cover = ''
  form.description = ''
  form.views = 0
  form.content = ''
  form.customFields = []
  originalId.value = ''
  idTouched.value = false
  errorMessage.value = ''
  successMessage.value = ''
  savedAt.value = ''
  autosavedAt.value = ''
  isDirty.value = false
}

const getEditorValue = () => {
  if (editor && editorReady.value) {
    return editor.getValue()
  }
  return form.content || ''
}

const setEditorValue = (value) => {
  if (!editor || !editorReady.value) return
  suppressEditorInput.value = true
  editor.setValue(value || '', true)
  suppressEditorInput.value = false
}

const createEditor = () => {
  if (editor && typeof editor.destroy === 'function') {
    editor.destroy()
  }

  editorReady.value = false

  editor = new Vditor(editorId, {
    mode: 'sv',
    height: '100%',
    cache: { enable: false },
    counter: { enable: true },
    toolbarConfig: { pin: true },
    placeholder: '在这里编写 Markdown 内容...',
    toolbar: [
      'headings',
      'bold',
      'italic',
      'strike',
      '|',
      'list',
      'ordered-list',
      'check',
      'outdent',
      'indent',
      '|',
      'quote',
      'line',
      'code',
      'inline-code',
      'insert-before',
      'insert-after',
      '|',
      'link',
      'table',
      'upload',
      '|',
      'undo',
      'redo',
      '|',
      'both',
      'preview',
      'fullscreen'
    ],
    preview: {
      delay: 150,
      actions: [],
      markdown: {
        toc: true,
        mark: true
      }
    },
    input(value) {
      if (suppressEditorInput.value) return
      form.content = value
    },
    after() {
      editorReady.value = true
      setEditorValue(form.content)
    }
  })
}

const onIdInput = (event) => {
  idTouched.value = true
  form.id = slugify(event.target.value)
}

const fillIdFromTitle = () => {
  idTouched.value = true
  form.id = slugify(form.title)
}

const addCustomField = () => {
  form.customFields.push({ key: '', value: '' })
}

const removeCustomField = (index) => {
  form.customFields.splice(index, 1)
}

const insertTemplate = (snippet) => {
  if (editor && editorReady.value && typeof editor.insertValue === 'function') {
    editor.insertValue(snippet)
    return
  }

  form.content = `${form.content}${snippet}`
}

const parseExtraFieldValue = (value) => {
  if (/^-?\d+(\.\d+)?$/.test(value)) return value
  if (/^(true|false)$/i.test(value)) return value.toLowerCase()
  return JSON.stringify(value)
}

const buildMarkdownDoc = () => {
  const lines = ['---']

  lines.push(`title: ${JSON.stringify(form.title.trim())}`)
  if (form.date) lines.push(`date: ${form.date}`)
  if (form.author) lines.push(`author: ${JSON.stringify(form.author.trim())}`)
  if (form.category) lines.push(`category: ${JSON.stringify(form.category.trim())}`)

  const tags = splitTags(form.tags)
  if (tags.length > 0) {
    lines.push(`tags: [${tags.map(tag => JSON.stringify(tag)).join(', ')}]`)
  }

  if (form.cover) lines.push(`cover: ${JSON.stringify(form.cover.trim())}`)
  if (form.description) lines.push(`description: ${JSON.stringify(form.description.trim())}`)

  const views = Number(form.views)
  lines.push(`views: ${Number.isFinite(views) && views >= 0 ? Math.floor(views) : 0}`)

  form.customFields.forEach((field) => {
    const key = String(field.key || '').trim()
    const value = String(field.value || '').trim()
    if (!key || !value) return
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) return
    lines.push(`${key}: ${parseExtraFieldValue(value)}`)
  })

  lines.push('---', '')
  lines.push(getEditorValue().replace(/\s+$/, ''))
  lines.push('')

  return lines.join('\n')
}

const syncLocalDraftState = () => {
  const raw = localStorage.getItem(localDraftKey.value)
  hasLocalDraft.value = !!raw

  if (!raw) {
    autosavedAt.value = ''
    return
  }

  try {
    const parsed = JSON.parse(raw)
    autosavedAt.value = formatTime(parsed.updatedAt)
  } catch {
    autosavedAt.value = ''
  }
}

const saveLocalDraft = () => {
  const snapshot = {
    title: form.title,
    id: form.id,
    date: form.date,
    author: form.author,
    category: form.category,
    tags: form.tags,
    cover: form.cover,
    description: form.description,
    views: form.views,
    content: getEditorValue(),
    customFields: form.customFields
  }

  localStorage.setItem(localDraftKey.value, JSON.stringify({
    updatedAt: new Date().toISOString(),
    snapshot
  }))

  hasLocalDraft.value = true
  autosavedAt.value = formatTime(new Date().toISOString())
}

const scheduleAutosave = () => {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer)
  }

  autosaveTimer = setTimeout(() => {
    saveLocalDraft()
  }, 1200)
}

const restoreLocalDraft = () => {
  const raw = localStorage.getItem(localDraftKey.value)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw)
    const snapshot = parsed.snapshot || {}

    pauseAutosave.value = true

    form.title = snapshot.title || ''
    form.id = snapshot.id || ''
    form.date = snapshot.date || todayDate()
    form.author = snapshot.author || defaultAuthor.value
    form.category = snapshot.category || ''
    form.tags = snapshot.tags || ''
    form.cover = snapshot.cover || ''
    form.description = snapshot.description || ''
    form.views = Number.isFinite(Number(snapshot.views)) ? Number(snapshot.views) : 0
    form.content = snapshot.content || ''
    form.customFields = Array.isArray(snapshot.customFields)
      ? snapshot.customFields.map(item => ({
          key: String(item?.key || ''),
          value: String(item?.value || '')
        }))
      : []

    setEditorValue(form.content)

    pauseAutosave.value = false
    isDirty.value = true
    successMessage.value = '已恢复本地草稿'
    errorMessage.value = ''
  } catch (error) {
    console.error('恢复草稿失败:', error)
    errorMessage.value = '本地草稿损坏，无法恢复'
  }
}

const clearLocalDraft = () => {
  localStorage.removeItem(localDraftKey.value)
  hasLocalDraft.value = false
  autosavedAt.value = ''
}

const loadArticle = async () => {
  pauseAutosave.value = true
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (!isEditMode.value) {
      setFormDefaults()
      setEditorValue(form.content)
      syncLocalDraftState()
      return
    }

    const id = String(route.params.id || '')
    if (!id) {
      throw new Error('缺少文章 ID')
    }

    const result = await readEditableArticle(id)
    const raw = result?.content || ''
    const parsed = fm(raw)
    const attrs = parsed.attributes || {}

    const knownKeys = new Set(['title', 'date', 'author', 'category', 'tags', 'cover', 'description', 'views'])

    form.title = attrs.title ? String(attrs.title) : id
    form.id = id
    form.date = normalizeDateInput(attrs.date) || todayDate()
    form.author = attrs.author ? String(attrs.author) : defaultAuthor.value
    form.category = attrs.category ? String(attrs.category) : ''
    form.tags = Array.isArray(attrs.tags)
      ? attrs.tags.map(tag => String(tag)).join(', ')
      : (typeof attrs.tags === 'string' ? attrs.tags : '')
    form.cover = attrs.cover ? String(attrs.cover) : ''
    form.description = attrs.description ? String(attrs.description) : ''
    form.views = Number.isFinite(Number(attrs.views)) ? Number(attrs.views) : 0
    form.content = parsed.body || ''

    form.customFields = Object.entries(attrs)
      .filter(([key]) => !knownKeys.has(key))
      .map(([key, value]) => ({
        key,
        value: Array.isArray(value) ? value.join(', ') : String(value ?? '')
      }))

    originalId.value = id
    idTouched.value = true

    setEditorValue(form.content)
    syncLocalDraftState()
    isDirty.value = false
  } catch (error) {
    console.error('读取文章失败:', error)
    errorMessage.value = error?.response?.data?.error || error.message || '读取文章失败'
  } finally {
    loading.value = false
    pauseAutosave.value = false
  }
}

const handleSave = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  ensureAutoMeta()

  const normalizedId = slugify(form.id)
  form.id = normalizedId

  if (!form.title.trim()) {
    errorMessage.value = '标题不能为空'
    return
  }

  if (!normalizedId) {
    errorMessage.value = '文章 ID 无效，只允许字母、数字、-、_'
    return
  }

  saving.value = true

  try {
    const markdownDoc = buildMarkdownDoc()
    await saveEditableArticle({
      id: normalizedId,
      originalId: isEditMode.value ? originalId.value : '',
      content: markdownDoc
    })

    savedAt.value = formatTime(new Date().toISOString())
    successMessage.value = '文章已保存'
    isDirty.value = false

    clearLocalDraft()

    originalId.value = normalizedId

    if (!isEditMode.value || String(route.params.id) !== normalizedId) {
      await router.replace({ name: 'ArticleEditorEdit', params: { id: normalizedId } })
    }
  } catch (error) {
    console.error('保存失败:', error)
    errorMessage.value = error?.response?.data?.error || error.message || '保存失败'
  } finally {
    saving.value = false
  }
}

const goToDrafts = () => {
  router.push({ path: '/settings/drafts' })
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

watch(defaultAuthor, (nextAuthor) => {
  if (!String(form.author || '').trim() && nextAuthor) {
    form.author = nextAuthor
  }
})

watch(() => form.title, (nextTitle) => {
  if (!idTouched.value && !isEditMode.value) {
    form.id = slugify(nextTitle)
  }
})

watch(form, () => {
  if (pauseAutosave.value || loading.value) return
  isDirty.value = true
  scheduleAutosave()
}, { deep: true })

watch(localDraftKey, () => {
  syncLocalDraftState()
})

watch(() => route.params.id, async () => {
  await loadArticle()
})

onMounted(async () => {
  createEditor()
  await loadArticle()
})

onBeforeUnmount(() => {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer)
  }

  if (editor && typeof editor.destroy === 'function') {
    editor.destroy()
  }

  editor = null
})
</script>

<style>
.editor-shell {
  min-height: calc(100vh - 6rem);
  padding: 1rem;
}

.editor-shell.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgb(248 250 252);
  padding: 0.75rem;
  overflow: hidden;
}

.dark .editor-shell.is-fullscreen {
  background: rgb(15 23 42);
}

.editor-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid rgb(226 232 240);
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
}

.dark .editor-header {
  border-color: rgb(51 65 85);
  background: rgba(30, 41, 59, 0.92);
}

.header-left,
.header-right {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.header-center {
  min-width: 0;
}

.title-input {
  width: 100%;
  height: 2.5rem;
  border-radius: 0.7rem;
  border: 1px solid rgb(203 213 225);
  background: rgb(255 255 255);
  padding: 0 0.85rem;
  font-size: 1rem;
  font-weight: 600;
  color: rgb(15 23 42);
}

.dark .title-input {
  border-color: rgb(71 85 105);
  background: rgba(15, 23, 42, 0.75);
  color: rgb(226 232 240);
}

.title-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.35);
}

.mode-pill,
.dirty-pill {
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}

.mode-pill {
  background: rgba(59, 130, 246, 0.15);
  color: rgb(37 99 235);
}

.dirty-pill {
  background: rgba(251, 146, 60, 0.2);
  color: rgb(194 65 12);
}

.status-text {
  font-size: 0.75rem;
  color: rgb(100 116 139);
}

.ghost-btn,
.primary-btn,
.mini-btn {
  border-radius: 0.65rem;
  font-size: 0.85rem;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.ghost-btn {
  padding: 0.42rem 0.75rem;
  border-color: rgb(203 213 225);
  color: rgb(51 65 85);
  background: rgba(255, 255, 255, 0.8);
}

.ghost-btn:hover {
  background: rgb(241 245 249);
}

.primary-btn {
  padding: 0.45rem 0.9rem;
  background: rgb(37 99 235);
  color: #fff;
}

.primary-btn:hover {
  background: rgb(29 78 216);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.editor-body {
  margin-top: 0.75rem;
  display: grid;
  grid-template-columns: 310px minmax(0, 1fr);
  gap: 0.75rem;
  height: calc(100vh - 11.5rem);
}

.editor-shell.is-fullscreen .editor-body {
  height: calc(100vh - 5.6rem);
}

.meta-panel,
.write-panel {
  border: 1px solid rgb(226 232 240);
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.92);
}

.dark .meta-panel,
.dark .write-panel {
  border-color: rgb(51 65 85);
  background: rgba(30, 41, 59, 0.88);
}

.meta-panel {
  padding: 0.85rem;
  overflow: auto;
}

.meta-title {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: rgb(30 41 59);
}

.dark .meta-title {
  color: rgb(226 232 240);
}

.meta-grid {
  display: grid;
  gap: 0.65rem;
}

.field span {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.75rem;
  color: rgb(71 85 105);
}

.dark .field span {
  color: rgb(148 163 184);
}

.field-input {
  width: 100%;
  border-radius: 0.65rem;
  border: 1px solid rgb(203 213 225);
  background: #fff;
  color: rgb(15 23 42);
  font-size: 0.82rem;
  padding: 0.42rem 0.58rem;
}

.dark .field-input {
  border-color: rgb(71 85 105);
  background: rgba(15, 23, 42, 0.72);
  color: rgb(226 232 240);
}

.field-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.28);
}

.field-input-readonly {
  background: rgb(248 250 252);
  color: rgb(71 85 105);
  cursor: default;
}

.dark .field-input-readonly {
  background: rgba(15, 23, 42, 0.45);
  color: rgb(148 163 184);
}

.field-inline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.45rem;
}

.mini-btn {
  padding: 0.35rem 0.6rem;
  border-color: rgb(203 213 225);
  background: rgb(248 250 252);
  color: rgb(51 65 85);
}

.mini-btn:hover {
  background: rgb(241 245 249);
}

.mini-btn.danger {
  border-color: rgba(239, 68, 68, 0.35);
  color: rgb(220 38 38);
}

.extra-fields {
  margin-top: 0.9rem;
}

.extra-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
}

.extra-header h3 {
  margin: 0;
  font-size: 0.8rem;
  color: rgb(51 65 85);
}

.dark .extra-header h3 {
  color: rgb(203 213 225);
}

.empty-tip {
  font-size: 0.75rem;
  color: rgb(100 116 139);
}

.field-list {
  display: grid;
  gap: 0.45rem;
}

.field-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 0.45rem;
}

.write-panel {
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  overflow: hidden;
  min-height: 0;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid rgb(226 232 240);
}

.dark .panel-head {
  border-bottom-color: rgb(51 65 85);
}

.head-left {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.head-left h2 {
  margin: 0;
  font-size: 0.9rem;
  color: rgb(30 41 59);
}

.dark .head-left h2 {
  color: rgb(226 232 240);
}

.head-note {
  font-size: 0.72rem;
  color: rgb(100 116 139);
}

.head-actions {
  display: inline-flex;
  gap: 0.4rem;
}

.status-error,
.status-success {
  margin: 0.45rem 0.7rem 0;
  border-radius: 0.65rem;
  padding: 0.48rem 0.65rem;
  font-size: 0.8rem;
}

.status-error {
  color: rgb(185 28 28);
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.status-success {
  color: rgb(5 150 105);
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.editor-wrap {
  min-height: 0;
  height: 100%;
  padding: 0.7rem;
  overflow: hidden;
}

.vditor-host {
  height: 100%;
  min-height: 520px;
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.vditor-host .vditor {
  border: 1px solid rgb(203 213 225);
  border-radius: 0.75rem;
  height: 100% !important;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.vditor-host .vditor-content {
  min-height: 0;
}

.dark .vditor-host .vditor {
  border-color: rgb(71 85 105);
}

.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  padding: 0.55rem 0.7rem;
  border-top: 1px solid rgb(226 232 240);
}

.dark .bottom-row {
  border-top-color: rgb(51 65 85);
}

.stats,
.actions {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.stats {
  font-size: 0.75rem;
  color: rgb(100 116 139);
}

.dark .stats {
  color: rgb(148 163 184);
}

@media (max-width: 1280px) {
  .editor-body {
    grid-template-columns: 1fr;
    height: auto;
  }

  .meta-panel {
    max-height: 20rem;
  }

  .vditor-host {
    min-height: 360px;
    height: 360px;
  }
}

@media (max-width: 768px) {
  .editor-shell {
    padding: 0.5rem;
  }

  .editor-header {
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }

  .header-left,
  .header-right {
    justify-content: space-between;
  }

  .panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .field-item {
    grid-template-columns: 1fr;
  }
}
</style>