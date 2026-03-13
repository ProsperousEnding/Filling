<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 flex items-center justify-center"
        :style="{ zIndex: String(zIndex) }"
        @keydown.esc.stop.prevent="onEsc"
        tabindex="-1"
      >
        <div class="fixed inset-0 bg-black/40" @click="onBackdrop"></div>

        <div
          class="relative mx-4 w-full max-w-lg rounded-xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-gray-800"
          :style="{ maxWidth: width }"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-start gap-3 p-5">
            <div v-if="showIcon" class="mt-0.5">
              <slot name="icon">
                <span
                  :class="[
                    'inline-flex h-8 w-8 items-center justify-center rounded-full',
                    iconBgClass
                  ]"
                >
                  <svg
                    v-if="type === 'success'"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="h-5 w-5"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.94a.75.75 0 0 0-1.22-.88l-4.037 5.595-2.084-2.084a.75.75 0 1 0-1.06 1.06l2.75 2.75c.33.33.87.29 1.15-.086l5.5-7.355Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <svg
                    v-else-if="type === 'warning'"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="h-5 w-5"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10.788 3.21c.448-.896 1.976-.896 2.424 0l8.143 16.286A1.35 1.35 0 0 1 20.143 21H3.857a1.35 1.35 0 0 1-1.212-1.504L10.788 3.21ZM12 8.25a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0V9a.75.75 0 0 0-.75-.75Zm0 8.25a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <svg
                    v-else-if="type === 'error'"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="h-5 w-5"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Zm2.47 6.53a.75.75 0 0 1 0 1.06L13.06 11.25l1.41 1.41a.75.75 0 1 1-1.06 1.06L12 12.31l-1.41 1.41a.75.75 0 1 1-1.06-1.06l1.41-1.41-1.41-1.41a.75.75 0 1 1 1.06-1.06L12 10.19l1.41-1.41a.75.75 0 0 1 1.06 0Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="h-5 w-5"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9-5.25a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 1.5 0v-.75a.75.75 0 0 0-.75-.75Zm0 3a.75.75 0 0 0-.75.75V16.5a.75.75 0 0 0 1.5 0V10.5a.75.75 0 0 0-.75-.75Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </span>
              </slot>
            </div>

            <div class="min-w-0 flex-1">
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
                <slot name="title">{{ title }}</slot>
              </h3>
              <div class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                <slot>
                  <p v-if="message">{{ message }}</p>
                </slot>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 border-t border-gray-100 p-4 dark:border-white/10">
            <button
              v-if="showCancel"
              type="button"
              class="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/20 dark:text-gray-200 dark:hover:bg-white/5"
              @click="onCancel"
            >
              {{ cancelText }}
            </button>
            <button
              ref="confirmButtonRef"
              type="button"
              :class="confirmClass"
              @click="onConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
  <!-- eslint-disable-next-line vue/no-unused-components -->
</template>

<script>
import { nextTick, ref, watch } from 'vue'

export default {
  name: 'Dialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '提示' },
    message: { type: String, default: '' },
    type: { type: String, default: 'info' }, // success | info | warning | error
    showCancel: { type: Boolean, default: false },
    confirmText: { type: String, default: '确定' },
    cancelText: { type: String, default: '取消' },
    closeOnEsc: { type: Boolean, default: true },
    closeOnBackdrop: { type: Boolean, default: true },
    width: { type: String, default: '28rem' },
    zIndex: { type: Number, default: 2000 },
    showIcon: { type: Boolean, default: true }
  },
  emits: ['update:modelValue', 'confirm', 'cancel', 'close'],
  setup (props, { emit }) {
    const confirmButtonRef = ref(null)

    const focusConfirm = async () => {
      await nextTick()
      if (confirmButtonRef.value) {
        try {
          confirmButtonRef.value.focus()
        } catch (_) {}
      }
    }

    watch(
      () => props.modelValue,
      (val) => {
        if (val) focusConfirm()
      },
      { immediate: true }
    )

    const hide = () => emit('update:modelValue', false)

    const onConfirm = () => {
      emit('confirm')
      emit('close', { action: 'confirm' })
      hide()
    }
    const onCancel = () => {
      emit('cancel')
      emit('close', { action: 'cancel' })
      hide()
    }
    const onEsc = (e) => {
      if (!props.modelValue) return
      if (props.closeOnEsc) onCancel()
    }
    const onBackdrop = () => {
      if (props.closeOnBackdrop) onCancel()
    }

    const iconBgClass = {
      success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
      info: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
      warning: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
      error: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
    }[props.type] || 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'

    const confirmClass = {
      success: 'inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
      info: 'inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50',
      warning: 'inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50',
      error: 'inline-flex items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50'
    }[props.type] || 'inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50'

    return {
      confirmButtonRef,
      onConfirm,
      onCancel,
      onEsc,
      onBackdrop,
      confirmClass,
      iconBgClass
    }
  }
}
</script>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.18s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
</style>


