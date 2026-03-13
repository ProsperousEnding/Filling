import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import { resolve } from 'path'
import tomlHmrPlugin from './vite-plugin-toml-hmr'
import configApiPlugin from './vite-plugin-config-api'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Markdown({
      markdownItOptions: {
        html: true,
        linkify: true,
        typographer: true
      }
    }),
    tomlHmrPlugin(),
    configApiPlugin()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
