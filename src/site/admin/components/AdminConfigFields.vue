<template>
  <div class="admin-field-list">
    <template v-for="(value, key) in modelValue" :key="key">
      <section v-if="isObject(value)" class="admin-field-group">
        <header class="admin-field-group-header">
          <h3>{{ getFieldLabel(key) }}</h3>
        </header>

        <AdminConfigFields
          :model-value="value"
          :root-model="rootModel"
          :path="buildPath(key)"
          @update:model-value="updateValue(key, $event)"
          @change="$emit('change')"
        />
      </section>

      <section v-else-if="Array.isArray(value)" class="admin-field-row admin-field-array-row">
        <template v-if="isObjectArray(key, value)">
          <div class="admin-field-array-header">
            <div>
              <h3>{{ getFieldLabel(key) }}</h3>
              <p>{{ value.length > 0 ? `共 ${value.length} 项` : '暂时没有内容' }}</p>
            </div>
            <button
              type="button"
              class="admin-icon-command"
              :aria-label="`新增${getFieldLabel(key)}`"
              :title="`新增${getFieldLabel(key)}`"
              @click="addArrayItem(key, value)"
            >
              <Plus aria-hidden="true" />
            </button>
          </div>

          <div v-if="value.length > 0" class="admin-repeatable-list">
            <section
              v-for="(item, index) in value"
              :key="index"
              class="admin-repeatable-item"
            >
              <header class="admin-repeatable-item-header">
                <span>{{ getItemTitle(item, index) }}</span>
                <button
                  type="button"
                  class="admin-icon-command admin-icon-command-danger"
                  :aria-label="`删除第 ${index + 1} 项`"
                  title="删除"
                  @click="removeArrayItem(key, value, index)"
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </header>

              <AdminConfigFields
                :model-value="item"
                :root-model="rootModel"
                :path="`${buildPath(key)}.${index}`"
                @update:model-value="updateArrayItem(key, value, index, $event)"
                @change="$emit('change')"
              />
            </section>
          </div>
        </template>

        <template v-else>
          <label :for="fieldId(key)">{{ getFieldLabel(key) }}</label>
          <textarea
            :id="fieldId(key)"
            class="admin-control admin-control-list"
            :value="value.join('\n')"
            rows="3"
            placeholder="每行填写一项"
            @input="updateStringList(key, $event.target.value)"
          />
          <span class="admin-field-hint">每行一项，空行会自动忽略。</span>
        </template>
      </section>

      <div v-else-if="typeof value === 'boolean'" class="admin-field-row admin-field-toggle-row">
        <div>
          <label :for="fieldId(key)">{{ getFieldLabel(key) }}</label>
        </div>
        <button
          :id="fieldId(key)"
          type="button"
          class="admin-toggle"
          :class="{ 'admin-toggle-active': value }"
          role="switch"
          :aria-checked="value"
          @click="updateValue(key, !value)"
        >
          <span aria-hidden="true" />
        </button>
      </div>

      <div v-else class="admin-field-row">
        <label :for="fieldId(key)">{{ getFieldLabel(key) }}</label>

        <select
          v-if="getOptions(key).length > 0"
          :id="fieldId(key)"
          class="admin-control"
          :value="value"
          @change="updateValue(key, $event.target.value)"
        >
          <option v-for="option in getOptions(key)" :key="option" :value="option">
            {{ getOptionLabel(option) }}
          </option>
        </select>

        <textarea
          v-else-if="isMultilineField(key, value)"
          :id="fieldId(key)"
          class="admin-control"
          :value="value"
          rows="4"
          @input="updateValue(key, $event.target.value)"
        />

        <div v-else-if="isColorValue(key, value)" class="admin-color-control">
          <input
            :id="`${fieldId(key)}-picker`"
            type="color"
            :value="value"
            :aria-label="`${getFieldLabel(key)}颜色选择`"
            @input="updateValue(key, $event.target.value)"
          />
          <input
            :id="fieldId(key)"
            class="admin-control"
            type="text"
            :value="value"
            @input="updateValue(key, $event.target.value)"
          />
        </div>

        <input
          v-else
          :id="fieldId(key)"
          class="admin-control"
          :type="typeof value === 'number' ? 'number' : 'text'"
          :value="value"
          :min="getNumberBounds(key).min"
          :max="getNumberBounds(key).max"
          :step="getNumberBounds(key).step"
          @input="updateScalar(key, value, $event.target.value)"
        />
      </div>
    </template>

    <p v-if="Object.keys(modelValue).length === 0" class="admin-field-empty">
      这里没有基础字段；可以切换到 TOML 模式添加高级配置。
    </p>
  </div>
</template>

<script setup>
import { Plus, Trash2 } from '@lucide/vue'

import {
  getArrayItemTemplate,
  getFieldLabel,
  getFieldOptions,
  isMultilineField
} from '../adminConfigModel.js'

defineOptions({ name: 'AdminConfigFields' })

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  rootModel: {
    type: Object,
    required: true
  },
  path: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const OPTION_LABELS = Object.freeze({
  '': '关闭',
  left: '左侧',
  right: '右侧',
  hidden: '隐藏',
  latest: '最新文章',
  featured: '精选文章',
  sticky: '置顶文章',
  mixed: '混合推荐',
  context: '单篇内容',
  list: '列表',
  card: '卡片',
  grid: '网格',
  timeline: '时间线',
  friends: '友情链接',
  auto: '自动',
  primary: '主菜单',
  more: '更多菜单',
  none: '无',
  gradient: '渐变',
  image: '图片',
  seeded: '自动生成',
  picsum: 'Picsum 摄影',
  cataas: 'Cataas 猫咪',
  'mwm-anime': 'MWM 二次元',
  'mwm-scenery': 'MWM 风景',
  'paugram-anime': '保罗二次元',
  'dmoe-anime': 'DMOE 二次元',
  loremflickr: 'LoremFlickr 风景',
  'paugram-bing': 'Bing 每日壁纸',
  lazy: '延迟加载',
  eager: '立即加载',
  contain: '完整显示',
  cover: '填满区域',
  icon: '图标',
  'header-background': '页眉背景',
  'page-background': '页面背景',
  transparent: '透明',
  glass: '毛玻璃',
  system: '系统字体',
  sans: '无衬线字体',
  serif: '衬线字体',
  mono: '等宽字体',
  giscus: 'Giscus',
  utterances: 'Utterances',
  top: '顶部',
  bottom: '底部',
  info: '信息',
  success: '成功',
  warning: '警告',
  umami: 'Umami',
  plausible: 'Plausible',
  google_analytics: 'Google Analytics',
  clarity: 'Microsoft Clarity'
})

function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function buildPath(key) {
  return `${props.path}.${key}`
}

function fieldId(key) {
  return `admin-field-${buildPath(key).replace(/[^a-zA-Z0-9_-]+/gu, '-')}`
}

function updateValue(key, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
  emit('change')
}

function updateScalar(key, originalValue, value) {
  if (typeof originalValue !== 'number') {
    updateValue(key, value)
    return
  }

  const number = Number(value)
  updateValue(key, Number.isFinite(number) ? number : originalValue)
}

function updateStringList(key, value) {
  updateValue(
    key,
    String(value || '')
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)
  )
}

function isObjectArray(key, value) {
  return value.some(isObject) || Boolean(getArrayItemTemplate(buildPath(key)))
}

function createEmptyLike(value) {
  if (typeof value === 'boolean') return true
  if (typeof value === 'number') return 0
  if (Array.isArray(value)) return []
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, createEmptyLike(item)])
    )
  }
  return ''
}

function addArrayItem(key, value) {
  const template = getArrayItemTemplate(buildPath(key))
    || (value[0] ? createEmptyLike(value[0]) : {})
  updateValue(key, [...value, template])
}

function updateArrayItem(key, value, index, nextItem) {
  const nextValue = value.slice()
  nextValue[index] = nextItem
  updateValue(key, nextValue)
}

function removeArrayItem(key, value, index) {
  updateValue(key, value.filter((_, itemIndex) => itemIndex !== index))
}

function getItemTitle(item, index) {
  return item?.title || item?.name || item?.display_name || `第 ${index + 1} 项`
}

function getOptions(key) {
  return getFieldOptions(buildPath(key), props.rootModel)
}

function getOptionLabel(option) {
  return OPTION_LABELS[option] || option || '关闭'
}

function isColorValue(key, value) {
  return key.includes('color') && /^#[\da-f]{6}$/iu.test(String(value || ''))
}

function getNumberBounds(key) {
  if (key === 'opacity') {
    return { min: 0, max: 1, step: 0.05 }
  }
  if (key.includes('columns')) {
    return { min: 1, max: 5, step: 1 }
  }
  return { min: undefined, max: undefined, step: 1 }
}
</script>
