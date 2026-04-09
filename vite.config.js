import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import { resolve } from 'path'
import { contentIndexPlugin } from './scripts/vite-plugin-content-index.mjs'

function resolveBase() {
  const rawBase = String(process.env.VITE_BASE_PATH || '').trim()

  if (!rawBase || rawBase === '/') {
    return '/'
  }

  return rawBase.endsWith('/') ? rawBase : `${rawBase}/`
}

export default defineConfig({
  base: resolveBase(),
  plugins: [
    contentIndexPlugin(),
    vue(),
    Markdown({
      markdownItOptions: {
        html: true,
        linkify: true,
        typographer: true
      }
    })
  ],
  server: {
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@blog': resolve(__dirname, 'blog'),
      '@site': resolve(__dirname, 'src/site'),
      '@framework': resolve(__dirname, 'src/framework')
    }
  }
})
