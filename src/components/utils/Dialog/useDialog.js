import { createApp, h, ref } from 'vue'
import Dialog from '../Dialog/Dialog.vue'

function mountDialog (props) {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const visible = ref(true)

    const app = createApp({
      setup () {
        const close = (ok) => {
          visible.value = false
          resolve(ok)
          // unmount after leave animation
          setTimeout(() => {
            app.unmount()
            if (container.parentNode) container.parentNode.removeChild(container)
          }, 200)
        }
        return () =>
          h(Dialog, {
            ...props,
            modelValue: visible.value,
            'onUpdate:modelValue': (v) => { visible.value = v },
            onConfirm: () => close(true),
            onCancel: () => close(false)
          })
      }
    })

    app.mount(container)
  })
}

export function openDialog (options = {}) {
  return mountDialog({
    title: '提示',
    message: '',
    type: 'info',
    showCancel: false,
    confirmText: '确定',
    cancelText: '取消',
    ...options
  })
}

export function alertDialog (message, options = {}) {
  return openDialog({
    message,
    showCancel: false,
    type: options.type || 'info',
    title: options.title || '提示',
    ...options
  })
}

export function confirmDialog (message, options = {}) {
  return openDialog({
    message,
    showCancel: true,
    type: options.type || 'warning',
    title: options.title || '确认',
    confirmText: options.confirmText || '确定',
    cancelText: options.cancelText || '取消',
    ...options
  })
}

export default {
  openDialog,
  alertDialog,
  confirmDialog
}


