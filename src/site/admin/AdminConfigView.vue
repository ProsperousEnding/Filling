<template>
  <div class="admin-shell">
    <header class="admin-topbar">
      <div class="admin-topbar-brand">
        <Settings2 aria-hidden="true" />
        <div>
          <strong>Filling</strong>
          <span>站点管理</span>
        </div>
      </div>

      <div v-if="session.authenticated" class="admin-topbar-actions">
        <RouterLink class="admin-icon-command" to="/" title="返回网站" aria-label="返回网站">
          <ExternalLink aria-hidden="true" />
        </RouterLink>
        <div class="admin-user">
          <img v-if="session.user?.avatarUrl" :src="session.user.avatarUrl" alt="" />
          <span>{{ session.user?.login }}</span>
        </div>
        <button
          type="button"
          class="admin-icon-command"
          title="退出登录"
          aria-label="退出登录"
          @click="handleLogout"
        >
          <LogOut aria-hidden="true" />
        </button>
      </div>
    </header>

    <main v-if="initialState === 'loading'" class="admin-centered-state">
      <LoaderCircle class="admin-spin" aria-hidden="true" />
      <p>正在连接管理服务</p>
    </main>

    <main v-else-if="initialState === 'error'" class="admin-centered-state">
      <CircleAlert aria-hidden="true" />
      <h1>管理服务暂时不可用</h1>
      <p>{{ pageError }}</p>
      <button type="button" class="admin-command" @click="bootstrap">
        <RefreshCw aria-hidden="true" />
        重试
      </button>
    </main>

    <main v-else-if="!session.authenticated" class="admin-login">
      <div class="admin-login-mark" aria-hidden="true">
        <GitHubMark />
      </div>
      <h1>管理员登录</h1>
      <p v-if="pageError" class="admin-login-error">{{ pageError }}</p>
      <a class="admin-command admin-command-primary" :href="loginUrl">
        <GitHubMark aria-hidden="true" />
        使用 GitHub 登录
      </a>
      <RouterLink to="/" class="admin-text-command">返回网站</RouterLink>
    </main>

    <div v-else class="admin-workspace">
      <aside class="admin-navigation" aria-label="配置导航">
        <div v-for="group in navigationGroups" :key="group.key" class="admin-nav-group">
          <h2>{{ group.label }}</h2>
          <button
            v-for="file in group.files"
            :key="file.key"
            type="button"
            class="admin-nav-item"
            :class="{ 'admin-nav-item-active': selectedKey === file.key }"
            @click="selectFile(file.key)"
          >
            <span>{{ file.title }}</span>
            <i v-if="isFileDirty(file)" aria-label="有未发布修改" />
          </button>
        </div>
      </aside>

      <section class="admin-editor-shell">
        <div class="admin-mobile-file-select">
          <label for="admin-current-file">配置模块</label>
          <select id="admin-current-file" v-model="selectedKey" class="admin-control">
            <option v-for="file in files" :key="file.key" :value="file.key">
              {{ file.title }}
            </option>
          </select>
        </div>

        <header v-if="selectedFile" class="admin-editor-header">
          <div>
            <div class="admin-editor-title-line">
              <h1>{{ selectedFile.title }}</h1>
              <span v-if="isFileDirty(selectedFile)" class="admin-dirty-label">未发布</span>
            </div>
            <p>{{ selectedFile.description }}</p>
            <code>{{ selectedFile.path }}</code>
          </div>

          <div class="admin-editor-controls">
            <div class="admin-view-tabs" role="tablist" aria-label="编辑方式">
              <button
                type="button"
                role="tab"
                :aria-selected="editorMode === 'form'"
                :class="{ active: editorMode === 'form' }"
                @click="setEditorMode('form')"
              >
                表单
              </button>
              <button
                type="button"
                role="tab"
                :aria-selected="editorMode === 'toml'"
                :class="{ active: editorMode === 'toml' }"
                @click="setEditorMode('toml')"
              >
                TOML
              </button>
            </div>

            <button
              type="button"
              class="admin-icon-command"
              title="恢复当前文件"
              aria-label="恢复当前文件"
              :disabled="!isFileDirty(selectedFile)"
              @click="resetSelectedFile"
            >
              <RotateCcw aria-hidden="true" />
            </button>
          </div>
        </header>

        <div v-if="selectedFile" class="admin-editor-content">
          <section v-if="selectedFile.key === 'cover' && editorMode === 'form'" class="admin-cover-picker">
            <header>
              <h2>默认图源</h2>
            </header>
            <div class="admin-cover-options">
              <button
                v-for="preview in coverPreviews"
                :key="preview.style"
                type="button"
                :class="{ active: selectedFile.model.seeded_style === preview.style }"
                @click="setCoverStyle(preview.style)"
              >
                <span class="admin-cover-image">
                  <img :src="preview.url" alt="" loading="lazy" />
                  <Check v-if="selectedFile.model.seeded_style === preview.style" aria-hidden="true" />
                </span>
                <span>{{ preview.label }}</span>
              </button>
            </div>
          </section>

          <AdminMenuEditor
            v-if="selectedFile.key === 'site' && editorMode === 'form'"
            :pages="selectedFile.model.menus?.pages || []"
            @update:pages="updateSiteMenuPages"
          />

          <AdminConfigFields
            v-if="editorMode === 'form'"
            :model-value="selectedFile.model"
            :root-model="selectedFile.model"
            :path="selectedFile.key"
            :excluded-keys="selectedFile.key === 'site' ? ['menus'] : []"
            @update:model-value="updateSelectedModel"
          />

          <textarea
            v-else
            class="admin-toml-editor"
            :value="selectedFile.content"
            :aria-label="`${selectedFile.title} TOML`"
            spellcheck="false"
            @input="updateSelectedToml($event.target.value)"
          />
        </div>

        <footer class="admin-publishbar">
          <div class="admin-validation-state" :class="`admin-validation-${validationState}`">
            <LoaderCircle v-if="validationState === 'checking'" class="admin-spin" aria-hidden="true" />
            <CircleCheck v-else-if="validationState === 'valid'" aria-hidden="true" />
            <TriangleAlert v-else-if="validationState === 'invalid'" aria-hidden="true" />
            <span>{{ validationMessage }}</span>
          </div>

          <div class="admin-publish-actions">
            <span>{{ dirtyFiles.length }} 个文件待发布</span>
            <button
              type="button"
              class="admin-command admin-command-primary"
              :disabled="dirtyFiles.length === 0 || validationState !== 'valid' || publishing"
              @click="showPublishReview = true"
            >
              <LoaderCircle v-if="publishing" class="admin-spin" aria-hidden="true" />
              <Save v-else aria-hidden="true" />
              发布配置
            </button>
          </div>
        </footer>
      </section>

      <aside class="admin-status-panel" aria-label="发布状态">
        <header>
          <h2>发布记录</h2>
          <button
            type="button"
            class="admin-icon-command"
            title="刷新发布状态"
            aria-label="刷新发布状态"
            @click="loadDeployments"
          >
            <RefreshCw :class="{ 'admin-spin': deploymentsLoading }" aria-hidden="true" />
          </button>
        </header>

        <div v-if="latestDeployment" class="admin-deployment">
          <div class="admin-deployment-status">
            <CircleCheck v-if="latestDeployment.conclusion === 'success'" aria-hidden="true" />
            <CircleX v-else-if="latestDeployment.conclusion === 'failure'" aria-hidden="true" />
            <LoaderCircle v-else class="admin-spin" aria-hidden="true" />
            <strong>{{ deploymentLabel }}</strong>
          </div>
          <p>{{ latestDeployment.title }}</p>
          <time>{{ formatDate(latestDeployment.updatedAt) }}</time>
          <a :href="latestDeployment.url" target="_blank" rel="noopener noreferrer">
            查看 GitHub Actions
            <ExternalLink aria-hidden="true" />
          </a>
        </div>
        <p v-else class="admin-status-empty">暂无发布记录</p>

        <section v-if="diagnostics.length > 0" class="admin-diagnostics">
          <h2>配置检查</h2>
          <ul>
            <li v-for="(diagnostic, index) in diagnostics" :key="`${diagnostic.code}-${index}`">
              <TriangleAlert aria-hidden="true" />
              <div>
                <strong>{{ diagnostic.path }}</strong>
                <span>{{ diagnostic.message }}</span>
              </div>
            </li>
          </ul>
        </section>
      </aside>
    </div>

    <div v-if="showPublishReview" class="admin-modal-backdrop" @click.self="showPublishReview = false">
      <section class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="publish-review-title">
        <header>
          <div>
            <h2 id="publish-review-title">确认发布配置</h2>
            <p>提交后将自动触发站点构建。</p>
          </div>
          <button
            type="button"
            class="admin-icon-command"
            title="关闭"
            aria-label="关闭"
            @click="showPublishReview = false"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <ul class="admin-review-files">
          <li v-for="review in publishReviews" :key="review.file.key">
            <FileText aria-hidden="true" />
            <div class="admin-review-file-content">
              <strong>{{ review.file.title }}</strong>
              <code>{{ review.file.path }}</code>
              <ul class="admin-review-diff">
                <li v-for="change in review.changes.slice(0, 8)" :key="change.path">
                  <code>{{ change.path }}</code>
                  <span>
                    <del>{{ formatAdminDiffValue(change.before) }}</del>
                    <span aria-hidden="true">→</span>
                    <ins>{{ formatAdminDiffValue(change.after) }}</ins>
                  </span>
                </li>
              </ul>
              <p v-if="review.changes.length > 8" class="admin-review-more">
                另有 {{ review.changes.length - 8 }} 项修改
              </p>
            </div>
          </li>
        </ul>

        <footer>
          <button type="button" class="admin-command" @click="showPublishReview = false">
            取消
          </button>
          <button
            type="button"
            class="admin-command admin-command-primary"
            :disabled="publishing"
            @click="publishChanges"
          >
            <LoaderCircle v-if="publishing" class="admin-spin" aria-hidden="true" />
            <Save v-else aria-hidden="true" />
            确认发布
          </button>
        </footer>
      </section>
    </div>

    <div v-if="toast" class="admin-toast" role="status">
      <CircleCheck v-if="toast.kind === 'success'" aria-hidden="true" />
      <CircleAlert v-else aria-hidden="true" />
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import {
  Check,
  CircleAlert,
  CircleCheck,
  CircleX,
  ExternalLink,
  FileText,
  LoaderCircle,
  LogOut,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  TriangleAlert,
  X
} from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { parse, stringify } from 'smol-toml'

import { createSeededArticleCover } from '../../framework/utils/articleCover.js'
import AdminConfigFields from './components/AdminConfigFields.vue'
import AdminMenuEditor from './components/AdminMenuEditor.vue'
import GitHubMark from './components/GitHubMark.vue'
import { createAdminConfigDiff, formatAdminDiffValue } from './adminConfigDiff.js'
import { createAdminConfigModel, createAdminConfigOverrides } from './adminConfigModel.js'
import {
  getAdminConfigs,
  getAdminDeployments,
  getAdminLoginUrl,
  getAdminSession,
  logoutAdmin,
  publishAdminConfigs,
  validateAdminConfigs
} from './adminApi.js'
import './admin.css'

const route = useRoute()
const router = useRouter()

const initialState = ref('loading')
const pageError = ref('')
const session = ref({ authenticated: false, user: null })
const files = ref([])
const headOid = ref('')
const baselineDiagnostics = ref([])
const selectedKey = ref('')
const editorMode = ref('form')
const diagnostics = ref([])
const validationState = ref('idle')
const publishing = ref(false)
const showPublishReview = ref(false)
const deployments = ref([])
const deploymentsLoading = ref(false)
const toast = ref(null)

let validationTimer = null
let validationSequence = 0
let deploymentTimer = null
let pendingDeploymentHeadOid = ''
let toastTimer = null

const GROUPS = Object.freeze([
  { key: 'site', label: '站点' },
  { key: 'appearance', label: '外观' },
  { key: 'content', label: '内容' },
  { key: 'interaction', label: '互动' },
  { key: 'features', label: '功能' },
  { key: 'integrations', label: '集成' }
])

const navigationGroups = computed(() => GROUPS
  .map(group => ({
    ...group,
    files: files.value.filter(file => file.group === group.key)
  }))
  .filter(group => group.files.length > 0))

const selectedFile = computed(() => (
  files.value.find(file => file.key === selectedKey.value) || null
))

const dirtyFiles = computed(() => files.value.filter(isFileDirty))

const publishReviews = computed(() => dirtyFiles.value.map((file) => {
  try {
    return {
      file,
      changes: createAdminConfigDiff(parse(file.originalContent), parse(file.content))
    }
  } catch {
    return { file, changes: [] }
  }
}))

const validationMessage = computed(() => {
  if (validationState.value === 'checking') return '正在检查配置'
  if (validationState.value === 'invalid') return '配置需要修正'
  if (validationState.value === 'valid') return '配置检查通过'
  return '尚无待发布修改'
})

const latestDeployment = computed(() => deployments.value[0] || null)

const deploymentLabel = computed(() => {
  const run = latestDeployment.value
  if (!run) return ''
  if (run.status !== 'completed') return '正在发布'
  if (run.conclusion === 'success') return '发布成功'
  if (run.conclusion === 'failure') return '发布失败'
  if (run.conclusion === 'cancelled') return '发布已取消'
  return '发布完成'
})

const coverPreviews = computed(() => {
  const model = selectedFile.value?.model || {}
  const sources = Array.isArray(model.source_switch?.sources)
    ? model.source_switch.sources
    : []
  const labels = model.source_switch?.labels || {}

  return sources.map(style => ({
    style,
    label: labels[style] || style,
    url: createSeededArticleCover('admin-cover-preview', {
      style,
      width: 420,
      height: 236,
      format: model.seeded_format || 'webp'
    })
  }))
})

const loginUrl = getAdminLoginUrl()

function normalizeToml(value) {
  const source = String(value || '').replaceAll('\r\n', '\n')
  return source.endsWith('\n') ? source : `${source}\n`
}

function buildEditableFile(file) {
  const configured = parse(file.content || '')
  return {
    ...file,
    content: normalizeToml(file.content),
    originalContent: normalizeToml(file.content),
    model: createAdminConfigModel(file.key, configured)
  }
}

function isFileDirty(file) {
  return Boolean(file && file.content !== file.originalContent)
}

function selectFile(key) {
  selectedKey.value = key
  editorMode.value = 'form'
}

function showToast(kind, message) {
  toast.value = { kind, message }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = null
  }, 5000)
}

async function bootstrap() {
  initialState.value = 'loading'
  pageError.value = route.query.error === 'forbidden'
    ? '当前 GitHub 账号没有管理权限。'
    : ''

  try {
    session.value = await getAdminSession()
    if (!session.value.authenticated) {
      initialState.value = 'ready'
      return
    }

    const configuration = await getAdminConfigs()
    files.value = configuration.files.map(buildEditableFile)
    headOid.value = configuration.headOid
    baselineDiagnostics.value = configuration.diagnostics || []
    diagnostics.value = baselineDiagnostics.value
    selectedKey.value = files.value[0]?.key || ''
    validationState.value = 'idle'
    initialState.value = 'ready'
    await loadDeployments()

    if (route.query.auth || route.query.error) {
      await router.replace({ path: '/admin/config' })
    }
  } catch (error) {
    initialState.value = 'error'
    pageError.value = error.message
  }
}

async function handleLogout() {
  if (!confirmDiscardChanges()) return
  try {
    await logoutAdmin()
  } finally {
    session.value = { authenticated: false, user: null }
    files.value = []
    initialState.value = 'ready'
  }
}

function confirmDiscardChanges() {
  return dirtyFiles.value.length === 0
    || publishing.value
    || window.confirm('有未发布的配置修改，确定离开吗？')
}

function handleBeforeUnload(event) {
  if (dirtyFiles.value.length === 0 || publishing.value) return
  event.preventDefault()
  event.returnValue = ''
}

function updateSelectedModel(model) {
  if (!selectedFile.value) return

  try {
    selectedFile.value.model = model
    selectedFile.value.content = normalizeToml(stringify(
      createAdminConfigOverrides(selectedFile.value.key, model)
    ))
    scheduleValidation()
  } catch (error) {
    validationState.value = 'invalid'
    diagnostics.value = [{
      level: 'error',
      code: 'toml-serialize-error',
      path: selectedFile.value.path,
      message: error.message
    }]
  }
}

function updateSelectedToml(value) {
  if (!selectedFile.value) return
  selectedFile.value.content = value
  scheduleValidation()
}

function setEditorMode(mode) {
  if (!selectedFile.value || mode === editorMode.value) return

  if (mode === 'form') {
    try {
      selectedFile.value.model = createAdminConfigModel(
        selectedFile.value.key,
        parse(selectedFile.value.content)
      )
    } catch (error) {
      showToast('error', `TOML 语法无效：${error.message}`)
      return
    }
  }

  editorMode.value = mode
}

function resetSelectedFile() {
  if (!selectedFile.value) return
  selectedFile.value.content = selectedFile.value.originalContent
  selectedFile.value.model = createAdminConfigModel(
    selectedFile.value.key,
    parse(selectedFile.value.originalContent)
  )
  scheduleValidation()
}

function setCoverStyle(style) {
  if (!selectedFile.value) return
  updateSelectedModel({
    ...selectedFile.value.model,
    seeded_style: style
  })
}

function updateSiteMenuPages(pages) {
  if (!selectedFile.value || selectedFile.value.key !== 'site') return
  updateSelectedModel({
    ...selectedFile.value.model,
    menus: {
      ...selectedFile.value.model.menus,
      pages
    }
  })
}

function scheduleValidation() {
  clearTimeout(validationTimer)
  validationSequence += 1
  if (dirtyFiles.value.length === 0) {
    validationState.value = 'idle'
    diagnostics.value = baselineDiagnostics.value
    return
  }

  validationState.value = 'checking'
  validationTimer = setTimeout(runValidation, 500)
}

async function runValidation() {
  const sequence = ++validationSequence
  try {
    const result = await validateAdminConfigs(
      dirtyFiles.value.map(file => ({ key: file.key, content: file.content }))
    )
    if (sequence !== validationSequence) return

    diagnostics.value = result.diagnostics || []
    validationState.value = result.valid ? 'valid' : 'invalid'
  } catch (error) {
    if (sequence !== validationSequence) return
    diagnostics.value = error.diagnostics || [{
      level: 'error',
      code: error.code,
      path: selectedFile.value?.path || '',
      message: error.message
    }]
    validationState.value = 'invalid'
  }
}

async function publishChanges() {
  if (publishing.value || dirtyFiles.value.length === 0) return

  publishing.value = true
  try {
    const changedFiles = dirtyFiles.value.slice()
    const result = await publishAdminConfigs(
      headOid.value,
      changedFiles.map(file => ({ key: file.key, content: file.content }))
    )

    headOid.value = result.headOid
    changedFiles.forEach((file) => {
      file.originalContent = file.content
    })
    baselineDiagnostics.value = result.diagnostics || []
    diagnostics.value = baselineDiagnostics.value
    validationState.value = 'idle'
    showPublishReview.value = false
    showToast('success', result.changed ? '配置已提交，正在构建站点。' : '配置没有发生变化。')
    if (result.changed) {
      startDeploymentPolling(result.headOid)
    }
  } catch (error) {
    diagnostics.value = error.diagnostics || diagnostics.value
    if (error.status === 409) {
      showToast('error', '远端配置已更新，请刷新页面后重新修改。')
    } else {
      showToast('error', error.message)
    }
  } finally {
    publishing.value = false
  }
}

async function loadDeployments() {
  if (!session.value.authenticated || deploymentsLoading.value) return
  deploymentsLoading.value = true
  try {
    const result = await getAdminDeployments()
    deployments.value = result.runs || []
  } catch (error) {
    showToast('error', error.message)
  } finally {
    deploymentsLoading.value = false
  }
}

function startDeploymentPolling(expectedHeadOid) {
  clearInterval(deploymentTimer)
  pendingDeploymentHeadOid = expectedHeadOid
  let attempts = 0
  loadDeployments()
  deploymentTimer = setInterval(async () => {
    attempts += 1
    await loadDeployments()
    const deployment = deployments.value.find(run => run.headSha === pendingDeploymentHeadOid)
    if (attempts >= 24 || deployment?.status === 'completed') {
      clearInterval(deploymentTimer)
      deploymentTimer = null
      pendingDeploymentHeadOid = ''
    }
  }, 5000)
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

onBeforeRouteLeave(() => confirmDiscardChanges())

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  bootstrap()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  clearTimeout(validationTimer)
  clearTimeout(toastTimer)
  clearInterval(deploymentTimer)
})
</script>
