<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 font-sf-pro">个人资料设置</h1>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <section class="panel">
            <h2 class="section-title">基础信息</h2>
            <form class="space-y-5" @submit.prevent="handleSave">
              <div>
                <label class="input-label">显示名称</label>
                <input v-model.trim="profileForm.displayName" type="text" class="input-field" placeholder="请输入显示名称" aria-required="true" />
                <p v-if="hasTriedSubmit && formErrors.displayName" class="text-xs text-red-500 mt-1">{{ formErrors.displayName }}</p>
              </div>
              <div>
                <label class="input-label">用户名</label>
                <input v-model.trim="profileForm.username" type="text" class="input-field" placeholder="用于个性化链接的唯一标识" />
                <p v-if="hasTriedSubmit && formErrors.username" class="text-xs text-red-500 mt-1">{{ formErrors.username }}</p>
              </div>
              <div>
                <label class="input-label">一句话简介</label>
                <input v-model.trim="profileForm.tagline" type="text" class="input-field" placeholder="例如：前端工程师 / 摄影爱好者" />
              </div>
              <div>
                <label class="input-label">个人简介</label>
                <textarea v-model.trim="profileForm.bio" class="input-field h-32" placeholder="介绍一下自己，让读者了解你"></textarea>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="input-label">所在地</label>
                  <input v-model.trim="profileForm.location" type="text" class="input-field" placeholder="填写所在城市或国家" />
                </div>
                <div>
                  <label class="input-label">个人网站</label>
                  <input v-model.trim="profileForm.website" type="text" class="input-field" placeholder="例如：https://example.com 或任意文本" />
                </div>
              </div>
            </form>
          </section>
          <section class="panel">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="section-title">个人头像</h2>
                <p class="section-subtitle">支持网络图片链接，建议使用正方形高质量图片。</p>
              </div>
              <button class="link-btn" @click="openAvatarGuide = true">上传指南</button>
            </div>
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div class="avatar-preview">
                <img v-if="profileForm.avatarUrl && !avatarPreviewInvalid" :src="profileForm.avatarUrl" :alt="profileForm.displayName" class="h-full w-full object-cover" @error="onAvatarError" />
                <span v-else class="text-3xl font-semibold text-primary">{{ avatarInitial }}</span>
                <div v-if="avatarPreviewInvalid" class="avatar-error">加载失败</div>
              </div>
              <div class="flex-1 w-full space-y-3">
                <input v-model.trim="profileForm.avatarUrl" type="url" class="input-field" placeholder="输入头像图片地址" @input="avatarPreviewInvalid = false" />
                <p v-if="hasTriedSubmit && formErrors.avatarUrl" class="text-xs text-red-500 mt-1">{{ formErrors.avatarUrl }}</p>
                <p class="helper-text">支持 JPG、PNG、SVG 等格式的网络链接，推荐尺寸 256x256 以上。</p>
                <div class="flex flex-wrap gap-2">
                  <button class="secondary-btn" @click="usePresetAvatar('https://avatars.githubusercontent.com/u/9919?s=200&v=4')">GitHub Logo</button>
                  <button class="secondary-btn" @click="usePresetAvatar('https://i.pravatar.cc/300?img=13')">随机头像</button>
                  <button class="secondary-btn" @click="profileForm.avatarUrl = ''">清除</button>
                </div>
              </div>
            </div>
          </section>
          <section class="panel">
            <div class="flex items-center justify-between mb-4">
              <h2 class="section-title">社交链接</h2>
              <button class="secondary-btn" @click="addSocialLink">新增链接</button>
            </div>
            <p class="helper-text mb-4">添加社交媒体或常用站点链接，展示在个人信息处。</p>
            <div class="space-y-4">
              <div v-for="(link, index) in profileForm.socialLinks" :key="link.id" class="link-card">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label class="field-label">名称</label>
                    <input v-model="link.label" type="text" class="input-field" placeholder="例如 GitHub" />
                    <p v-if="hasTriedSubmit && formErrors.socialLinks[index] && formErrors.socialLinks[index].label" class="text-xs text-red-500 mt-1">{{ formErrors.socialLinks[index].label }}</p>
                  </div>
                  <div>
                    <label class="field-label">URL</label>
                    <input v-model="link.url" type="url" class="input-field" placeholder="https://" />
                    <p v-if="hasTriedSubmit && formErrors.socialLinks[index] && formErrors.socialLinks[index].url" class="text-xs text-red-500 mt-1">{{ formErrors.socialLinks[index].url }}</p>
                  </div>
                  <div>
                    <label class="field-label">图标</label>
                    <input v-model="link.icon" type="text" class="input-field" placeholder="例如 i-carbon-logo-github" />
                  </div>
                </div>
                <div class="flex justify-end pt-3">
                  <button class="text-sm text-red-500 hover:text-red-400" @click="removeSocialLink(index)">删除</button>
                </div>
              </div>
              <div v-if="profileForm.socialLinks.length === 0" class="helper-text">尚未添加任何社交链接。</div>
            </div>
          </section>
          
        </div>
        <aside class="space-y-6">
          <section class="panel">
            <h2 class="section-title mb-4">预览</h2>
            <div class="text-center">
              <div class="preview-avatar-wrapper">
                <div class="preview-avatar-bg"></div>
                <div class="preview-avatar">
                  <img v-if="profileForm.avatarUrl && !avatarPreviewInvalid" :src="profileForm.avatarUrl" :alt="profileForm.displayName" class="h-full w-full object-cover" />
                  <span v-else class="text-2xl font-sf-pro text-primary">{{ avatarInitial }}</span>
                </div>
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 font-sf-pro">{{ profileForm.displayName }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 font-sf-pro">{{ profileForm.tagline }}</p>
            </div>
            <div class="mt-6 space-y-4 text-sm text-gray-600 dark:text-gray-400 text-left">
              <div v-if="profileForm.bio">
                <h4 class="meta-title">个人简介</h4>
                <p class="whitespace-pre-line leading-relaxed">{{ profileForm.bio }}</p>
              </div>
              <div v-if="profileForm.location">
                <h4 class="meta-title">所在地</h4>
                <p>{{ profileForm.location }}</p>
              </div>
              <div v-if="profileForm.website">
                <h4 class="meta-title">个人网站</h4>
                <a :href="profileForm.website" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">{{ profileForm.website }}</a>
              </div>
              <div v-if="profileForm.socialLinks.length">
                <h4 class="meta-title">社交链接</h4>
                <ul class="space-y-2">
                  <li v-for="link in profileForm.socialLinks" :key="link.id" class="flex items-center gap-2">
                    <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                      {{ link.icon ? link.icon.slice(0, 2).toUpperCase() : '' }}
                    </span>
                    <a :href="link.url" target="_blank" class="hover:underline">{{ link.label }}</a>
                  </li>
                </ul>
              </div>
            </div>
          </section>
          <section class="panel">
            <h2 class="section-title mb-4">操作</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="input-label mb-0">在主页侧边栏显示个人资料</label>
              <button
                type="button"
                @click="uiPrefs.showProfileInSidebar = !uiPrefs.showProfileInSidebar"
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                :class="uiPrefs.showProfileInSidebar ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'"
                role="switch"
                :aria-checked="uiPrefs.showProfileInSidebar"
                aria-label="在主页侧边栏显示个人资料"
              >
                <span
                  aria-hidden="true"
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out"
                  :class="uiPrefs.showProfileInSidebar ? 'translate-x-5' : 'translate-x-0'"
                ></span>
              </button>
            </div>
            <div v-if="uiPrefs.showProfileInSidebar">
              <label class="input-label">侧边栏位置</label>
              <div class="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700/50 p-1">
                <button
                  type="button"
                  @click="uiPrefs.sidebarPosition = 'left'"
                  class="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200"
                  :class="uiPrefs.sidebarPosition === 'left' 
                    ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
                >
                  左侧
                </button>
                <button
                  type="button"
                  @click="uiPrefs.sidebarPosition = 'right'"
                  class="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200"
                  :class="uiPrefs.sidebarPosition === 'right' 
                    ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
                >
                  右侧
                </button>
              </div>
            </div>
              <button class="primary-btn w-full" @click="handleSave" :disabled="isSaving">保存设置</button>
              <button class="secondary-btn w-full" @click="handleReset">恢复默认（从TOML加载）</button>
              <button class="secondary-btn w-full" @click="showExportModal = true">导出配置为TOML</button>
              <button class="link-btn block w-full text-left" @click="goToLogs">管理个人日志</button>
              <button class="link-btn block w-full text-left" @click="goToDrafts">管理文章草稿</button>
            </div>
          </section>
          <section class="panel">
            <h2 class="section-title mb-3">快速指南</h2>
            <ul class="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <li><strong class="text-gray-800 dark:text-gray-200">个性化展示：</strong>头像、简介、社交链接将在侧边栏个人信息区域展示。</li>
              <li><strong class="text-gray-800 dark:text-gray-200">社交图标：</strong>使用 Iconify 图标名称或保留空白显示默认图标。</li>
              <li><strong class="text-gray-800 dark:text-gray-200">存储位置：</strong>所有个性化数据保存在浏览器本地，可随时导出备份。</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="openAvatarGuide" class="modal-mask" @click.self="openAvatarGuide = false">
          <div class="modal-card">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">头像上传指南</h3>
              <button class="text-gray-400 hover:text-gray-500" @click="openAvatarGuide = false" aria-label="关闭">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul class="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>使用正方形图片，确保主体居中。</li>
              <li>推荐尺寸 256x256 或更高，以保证显示清晰。</li>
              <li>如需上传本地图片，可先上传到图床（如 GitHub、Imgur 等）后粘贴链接。</li>
              <li>支持 PNG、JPG、GIF、SVG 等常见网络图片格式。</li>
            </ul>
            <div class="mt-6 text-right">
              <button class="primary-btn" @click="openAvatarGuide = false">了解了</button>
            </div>
          </div>
        </div>
      </Transition>
      
      <Transition name="fade">
        <div v-if="showExportModal" class="modal-mask" @click.self="showExportModal = false">
          <div class="modal-card max-w-3xl">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">导出配置为 TOML</h3>
              <button class="text-gray-400 hover:text-gray-500" @click="showExportModal = false" aria-label="关闭">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div class="mb-4">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                复制以下内容到 <code class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">src/config/profile.toml</code> 文件中：
              </p>
              <textarea 
                ref="exportTextarea"
                :value="exportedTomlContent"
                readonly
                class="w-full h-64 px-4 py-3 text-sm font-mono border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
              ></textarea>
            </div>
            
            <div class="flex justify-end gap-3">
              <button class="secondary-btn" @click="showExportModal = false">关闭</button>
              <button class="primary-btn" @click="copyToClipboard">复制到剪贴板</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '../../stores/config'
import { stringifyToml } from '../../utils/tomlParser'
import { getProfileConfig, clearConfigCache } from '../../services/configLoader'

const router = useRouter()
const configStore = useConfigStore()
const openAvatarGuide = ref(false)
const showExportModal = ref(false)
const exportTextarea = ref(null)
const avatarPreviewInvalid = ref(false)
const isSaving = ref(false)
const hasTriedSubmit = ref(false)
const uiPrefs = reactive({
  showProfileInSidebar: true,
  sidebarPosition: 'right'
})


const profileForm = reactive({
  displayName: '',
  username: '',
  tagline: '',
  bio: '',
  avatarUrl: '',
  location: '',
  website: '',
  socialLinks: []
})

const avatarInitial = computed(() => {
  const name = profileForm.displayName
  return typeof name === 'string' && name.length > 0 ? name.charAt(0).toUpperCase() : ''
})

// 基础校验
const isValidUrl = (url) => {
  try {
    if (!url) return false
    // URL 构造器会在无效时抛出异常
    new URL(url)
    return true
  } catch {
    return false
  }
}

const formErrors = computed(() => {
  const errors = {
    displayName: '',
    username: '',
    website: '',
    avatarUrl: '',
    socialLinks: []
  }

  if (!profileForm.displayName || !String(profileForm.displayName).trim()) {
    errors.displayName = '显示名称为必填项'
  }

  if (profileForm.username && !/^[a-zA-Z0-9_-]{3,32}$/.test(profileForm.username)) {
    errors.username = '用户名需为 3-32 位：字母、数字、下划线或中划线'
  }

  // 个人网站不做 URL 校验，允许任意字符串

  if (profileForm.avatarUrl && !isValidUrl(profileForm.avatarUrl)) {
    errors.avatarUrl = '头像 URL 无效'
  }

  errors.socialLinks = profileForm.socialLinks.map((link) => {
    const se = { label: '', url: '', icon: '' }
    if (link.url && !isValidUrl(link.url)) {
      se.url = '链接 URL 无效'
    }
    if (link.url && (!link.label || !String(link.label).trim())) {
      se.label = '当填写 URL 时，请补充名称'
    }
    return se
  })

  return errors
})

const isFormValid = computed(() => {
  const e = formErrors.value
  const baseOk = !e.displayName && !e.username && !e.avatarUrl
  const linksOk = e.socialLinks.every((le) => !le.label && !le.url)
  return baseOk && linksOk
})

// 生成导出的 TOML 内容
const exportedTomlContent = computed(() => {
  const profileData = {
    display_name: profileForm.displayName,
    username: profileForm.username,
    tagline: profileForm.tagline,
    bio: profileForm.bio,
    avatar_url: profileForm.avatarUrl,
    location: profileForm.location,
    website: profileForm.website,
    social_links: profileForm.socialLinks.map(link => ({
      label: link.label,
      url: link.url,
      icon: link.icon
    }))
  }
  
  return stringifyToml(profileData)
})

// 复制到剪贴板
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(exportedTomlContent.value)
    alert(' 配置已复制到剪贴板！\n请粘贴到 src/config/profile.toml 文件中。')
    showExportModal.value = false
  } catch (error) {
    console.error('复制失败:', error)
    // 备用方案：选中文本
    if (exportTextarea.value) {
      exportTextarea.value.select()
      document.execCommand('copy')
      alert(' 配置已复制到剪贴板！')
      showExportModal.value = false
    }
  }
}

const loadFormFromToml = async () => {
  try {
    clearConfigCache()
    const profile = await getProfileConfig()
    profileForm.displayName = profile?.display_name || ''
    profileForm.username = profile?.username || ''
    profileForm.tagline = profile?.tagline || ''
    profileForm.bio = profile?.bio || ''
    profileForm.avatarUrl = profile?.avatar_url || ''
    profileForm.location = profile?.location || ''
    profileForm.website = profile?.website || ''
    profileForm.socialLinks = Array.isArray(profile?.social_links)
      ? profile.social_links.map(link => ({
          id: (crypto.randomUUID && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
          label: link?.label || '',
          url: link?.url || '',
          icon: link?.icon || ''
        }))
      : []
    avatarPreviewInvalid.value = false
  } catch (error) {
    console.error('加载 profile.toml 失败:', error)
  }
}

// 只在组件挂载时从 profile.toml 加载一次
onMounted(() => {
  loadFormFromToml()
  // 从 store 初始化站点展示偏好
  uiPrefs.showProfileInSidebar = (configStore.showProfileInSidebar ?? true)
  uiPrefs.sidebarPosition = configStore.sidebarPosition || 'right'
})

// 即时生效：偏好变更立刻更新到 store（保存时再写入 TOML）
watch(() => uiPrefs.showProfileInSidebar, (val) => {
  configStore.updateConfig({ showProfileInSidebar: val })
})
watch(() => uiPrefs.sidebarPosition, (val) => {
  configStore.updateConfig({ sidebarPosition: val })
})

// 不再监听 store 变化，避免在保存时被覆盖
// 用户保存后预览区会自动更新，如果想同步输入框，手动刷新页面即可

const onAvatarError = () => {
  avatarPreviewInvalid.value = true
}

const usePresetAvatar = (url) => {
  profileForm.avatarUrl = url
  avatarPreviewInvalid.value = false
}

const addSocialLink = () => {
  profileForm.socialLinks.push({
    id: (crypto.randomUUID && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    label: '',
    url: '',
    icon: ''
  })
}

const removeSocialLink = (index) => {
  profileForm.socialLinks.splice(index, 1)
}

const handleSave = async () => {
  hasTriedSubmit.value = true
  if (!isFormValid.value) {
    alert('请修正表单中的错误后再保存。')
    return
  }

  isSaving.value = true

  try {
    console.log('💾 开始保存个人资料配置...')
    console.log('📝 当前表单数据:', { displayName: profileForm.displayName })
    
    // 更新配置（store 会立即更新并保存到文件）
    await configStore.updateUserProfile({
      displayName: profileForm.displayName,
      username: profileForm.username,
      tagline: profileForm.tagline,
      bio: profileForm.bio,
      avatarUrl: profileForm.avatarUrl,
      location: profileForm.location,
      website: profileForm.website,
      socialLinks: profileForm.socialLinks.filter(link => link.url)
    })
    
    console.log('✅ 个人资料配置保存成功')
    // 保存站点展示相关到 site.toml
    configStore.updateConfig({
      showProfileInSidebar: uiPrefs.showProfileInSidebar,
      sidebarPosition: uiPrefs.sidebarPosition
    })
    await configStore.saveSiteToToml()
    alert('✅ 配置已保存到 profile.toml 与 site.toml 文件！')
  } catch (error) {
    console.error('❌ 保存失败:', error)
    alert('❌ 保存失败：' + error.message)
  } finally {
    isSaving.value = false
  }
}

const handleReset = async () => {
  if (confirm('确定要从 TOML 配置文件恢复默认设置吗？\n这将清除所有本地存储的个性化设置。')) {
    await configStore.resetPersonalization()
    // 重新从 TOML 加载配置
    await configStore.reloadConfigFromToml()
    await loadFormFromToml()
    uiPrefs.showProfileInSidebar = (configStore.showProfileInSidebar ?? true)
    uiPrefs.sidebarPosition = configStore.sidebarPosition || 'right'
    alert(' 配置已从 TOML 文件重新加载！')
  }
}

const goToLogs = () => {
  router.push({ path: '/settings/logs' })
}

const goToDrafts = () => {
  router.push({ path: '/settings/drafts' })
}
</script>

<style>
.container { min-height: calc(100vh - 8rem); }
.panel { 
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  border: 1px solid rgb(243, 244, 246);
}
.dark .panel {
  background-color: rgba(31, 41, 55, 0.8);
  border-color: rgb(55, 65, 81);
}
.section-title { 
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(17, 24, 39);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
}
.dark .section-title { color: rgb(243, 244, 246); }
.section-subtitle { font-size: 0.875rem; color: rgb(107, 114, 128); }
.dark .section-subtitle { color: rgb(156, 163, 175); }
.input-label { 
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(55, 65, 81);
  margin-bottom: 0.5rem;
}
.dark .input-label { color: rgb(209, 213, 219); }
.field-label { 
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgb(107, 114, 128);
  display: block;
  margin-bottom: 0.25rem;
}
.dark .field-label { color: rgb(156, 163, 175); }
.input-field { 
  width: 100%;
  padding: 0.625rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(229, 231, 235);
  background-color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  color: rgb(55, 65, 81);
  transition: all 0.2s;
}
.input-field:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
}
.dark .input-field {
  background-color: rgba(55, 65, 81, 0.7);
  border-color: rgb(75, 85, 99);
  color: rgb(229, 231, 235);
}
.helper-text { font-size: 0.75rem; color: rgb(107, 114, 128); }
.dark .helper-text { color: rgb(156, 163, 175); }
.primary-btn { 
  padding: 0.625rem 1rem;
  background-color: rgb(59, 130, 246);
  color: white;
  border-radius: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
}
.primary-btn:hover { background-color: rgba(59, 130, 246, 0.9); }
.primary-btn:focus { outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4); }
.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.secondary-btn { 
  padding: 0.375rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: rgb(59, 130, 246);
  font-size: 0.875rem;
  transition: all 0.2s;
}
.secondary-btn:hover { background-color: rgba(59, 130, 246, 0.1); }
.link-btn { font-size: 0.875rem; color: rgb(59, 130, 246); }
.link-btn:hover { color: rgba(59, 130, 246, 0.8); }
.avatar-preview { 
  position: relative;
  height: 7rem;
  width: 7rem;
  border-radius: 9999px;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  background-color: rgb(243, 244, 246);
  display: flex;
  align-items: center;
  justify-content: center;
}
.dark .avatar-preview { background-color: rgb(55, 65, 81); }
.avatar-error { 
  position: absolute;
  inset: 0;
  background-color: rgba(239, 68, 68, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
}
.preview-avatar-wrapper { 
  position: relative;
  display: inline-block;
  height: 6rem;
  width: 6rem;
  margin-bottom: 1rem;
}
.preview-avatar-bg { 
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.2), rgba(167, 139, 250, 0.2));
  animation: gradient 8s ease infinite;
  background-size: 200% 200%;
}
.preview-avatar { 
  position: relative;
  height: 100%;
  width: 100%;
  border-radius: 9999px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  box-shadow: 0 0 0 2px rgb(243, 244, 246);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(243, 244, 246);
}
.dark .preview-avatar { 
  box-shadow: 0 0 0 2px rgb(55, 65, 81);
  background-color: rgb(55, 65, 81);
}
.meta-title { 
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgb(107, 114, 128);
  margin-bottom: 0.25rem;
}
.dark .meta-title { color: rgb(156, 163, 175); }
.link-card { 
  padding: 1rem;
  border-radius: 0.75rem;
  background-color: rgba(249, 250, 251, 0.7);
  border: 1px solid rgb(243, 244, 246);
}
.dark .link-card {
  background-color: rgba(55, 65, 81, 0.6);
  border-color: rgb(75, 85, 99);
}
.modal-mask { 
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal-card { 
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 32rem;
  width: 100%;
  padding: 1.5rem;
  border: 1px solid rgb(243, 244, 246);
}
.dark .modal-card {
  background-color: rgb(31, 41, 55);
  border-color: rgb(55, 65, 81);
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.font-sf-pro { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif; }
</style>
