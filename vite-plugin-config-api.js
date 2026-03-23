/**
 * Vite 插件：配置文件读写 API
 * 提供 HTTP API 来读取和写入 TOML 配置文件
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import fm from 'front-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default function configApiPlugin() {
  const configDir = path.resolve(__dirname, 'src/config')
  
  return {
    name: 'vite-plugin-config-api',
    
    configureServer(server) {
      const profilePath = () => path.join(configDir, 'profile.toml')
      const profileDefaultPath = () => path.join(configDir, 'profile_default.toml')
      const articlesDir = path.resolve(__dirname, 'docs/articles')
      const ensureArticlesDir = () => {
        if (!fs.existsSync(articlesDir)) {
          fs.mkdirSync(articlesDir, { recursive: true })
        }
      }
      const normalizeArticleId = (value) => {
        if (typeof value !== 'string') return ''
        return value.trim().replace(/\.md$/i, '')
      }
      const isValidArticleId = (value) => /^[a-zA-Z0-9_-]+$/.test(value)
      const articleFilePath = (id) => path.join(articlesDir, `${id}.md`)
      const parseArticleMeta = (raw, fallbackId) => {
        const parsed = fm(raw || '')
        const attrs = parsed.attributes || {}
        const normalizedTags = Array.isArray(attrs.tags)
          ? attrs.tags.map(tag => String(tag))
          : typeof attrs.tags === 'string'
            ? attrs.tags.split(',').map(tag => tag.trim()).filter(Boolean)
            : []
        return {
          id: fallbackId,
          title: attrs.title ? String(attrs.title) : fallbackId,
          date: attrs.date ? String(attrs.date) : '',
          author: attrs.author ? String(attrs.author) : '',
          category: attrs.category ? String(attrs.category) : '',
          tags: normalizedTags,
          cover: attrs.cover ? String(attrs.cover) : '',
          description: attrs.description ? String(attrs.description) : '',
          views: Number.isFinite(Number(attrs.views)) ? Number(attrs.views) : 0
        }
      }
      const invalidateArticleModule = (targetFilePath) => {
        const relatedModules = server.moduleGraph.getModulesByFile(targetFilePath)
        if (relatedModules) {
          relatedModules.forEach(mod => mod && server.moduleGraph.invalidateModule(mod))
        }
        const rawId = targetFilePath.replace(/\\/g, '/') + '?raw'
        const rawModule = server.moduleGraph.getModuleById(rawId)
        if (rawModule) server.moduleGraph.invalidateModule(rawModule)
      }
      const invalidateArticle = (filePath, fileName) => {
        invalidateArticleModule(filePath)

        const articleRelatedFiles = [
          path.resolve(__dirname, 'src/services/contentService.js'),
          path.resolve(__dirname, 'src/api/markdownAdapter.js'),
          path.resolve(__dirname, 'src/api/articles.js'),
          path.resolve(__dirname, 'src/stores/article.js')
        ]

        articleRelatedFiles.forEach(targetPath => invalidateArticleModule(targetPath))

        server.ws.send({
          type: 'custom',
          event: 'article-content-updated',
          data: {
            file: filePath,
            fileName,
            timestamp: Date.now()
          }
        })

        // Trigger browser refresh so import.meta.glob eager caches are rebuilt.
        server.ws.send({ type: 'full-reload' })
      }
      const invalidateToml = (filePath) => {
        const relatedModules = server.moduleGraph.getModulesByFile(filePath)
        if (relatedModules) relatedModules.forEach(mod => mod && server.moduleGraph.invalidateModule(mod))
        const rawId = filePath.replace(/\\/g, '/') + '?raw'
        const rawModule = server.moduleGraph.getModuleById(rawId)
        if (rawModule) server.moduleGraph.invalidateModule(rawModule)
        server.ws.send({ type: 'custom', event: 'toml-config-updated', data: { file: filePath, fileName: path.basename(filePath), timestamp: Date.now() } })
      }
      // API: 读取配置文件
      server.middlewares.use('/api/config/read', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }
        
        try {
          const url = new URL(req.url, `http://${req.headers.host}`)
          const fileName = url.searchParams.get('file')
          
          if (!fileName || !fileName.match(/^[a-zA-Z0-9_-]+\.toml$/)) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: '无效的文件名' }))
            return
          }
          
          const filePath = path.join(configDir, fileName)
          
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: '文件不存在' }))
            return
          }
          
          const content = fs.readFileSync(filePath, 'utf-8')
          
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ 
            success: true,
            fileName,
            content 
          }))
        } catch (error) {
          console.error('读取配置文件失败:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ error: error.message }))
        }
      })
      
      // API: 写入配置文件
      server.middlewares.use('/api/config/write', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }
        
        let body = ''
        req.on('data', chunk => {
          body += chunk.toString()
        })
        
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            const { fileName, content } = data
            
            if (!fileName || !fileName.match(/^[a-zA-Z0-9_-]+\.toml$/)) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: '无效的文件名' }))
              return
            }
            
            if (typeof content !== 'string') {
              res.statusCode = 400
              res.end(JSON.stringify({ error: '无效的内容' }))
              return
            }
            
            const filePath = path.join(configDir, fileName)
            
      
            
            // 写入新内容
            fs.writeFileSync(filePath, content, 'utf-8')
            
            console.log(` 配置文件已更新: ${fileName}`)
            
            // 触发 HMR：失效与该文件相关的所有模块（包括 ?raw 导入）
            const relatedModules = server.moduleGraph.getModulesByFile(filePath)
            if (relatedModules) {
              relatedModules.forEach(mod => {
                if (mod) server.moduleGraph.invalidateModule(mod)
              })
            }
            // 兼容直接通过 id 查找（包含 ?raw 的模块 id）
            const rawId = filePath.replace(/\\/g, '/') + '?raw'
            const rawModule = server.moduleGraph.getModuleById(rawId)
            if (rawModule) {
              server.moduleGraph.invalidateModule(rawModule)
            }
            
            // 发送 TOML 配置更新事件（与HMR插件保持一致）
            server.ws.send({
              type: 'custom',
              event: 'toml-config-updated',
              data: { 
                file: filePath,
                fileName,
                timestamp: Date.now()
              }
            })
            
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ 
              success: true,
              message: '配置文件已成功更新',
              fileName 
            }))
          } catch (error) {
            console.error('写入配置文件失败:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: error.message }))
          }
        })
      })
      
      // API: 列出所有配置文件
      server.middlewares.use('/api/config/list', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }
        
        try {
          const files = fs.readdirSync(configDir)
            .filter(file => file.endsWith('.toml'))
          
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ 
            success: true,
            files 
          }))
        } catch (error) {
          console.error('列出配置文件失败:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ error: error.message }))
        }
      })

      // API: 删除配置文件
      server.middlewares.use('/api/config/delete', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }
        let body = ''
        req.on('data', chunk => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            const { fileName } = data
            if (!fileName || !fileName.match(/^[a-zA-Z0-9_-]+\.toml$/)) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: '无效的文件名' }))
              return
            }
            const filePath = path.join(configDir, fileName)
            if (!fs.existsSync(filePath)) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: '文件不存在' }))
              return
            }
            fs.unlinkSync(filePath)
            console.log(` 已删除配置文件: ${fileName}`)

            // 失效相关模块（包括 ?raw）
            const relatedModules = server.moduleGraph.getModulesByFile(filePath)
            if (relatedModules) {
              relatedModules.forEach(mod => mod && server.moduleGraph.invalidateModule(mod))
            }
            const rawId = filePath.replace(/\\/g, '/') + '?raw'
            const rawModule = server.moduleGraph.getModuleById(rawId)
            if (rawModule) server.moduleGraph.invalidateModule(rawModule)

            // 广播配置更新事件
            server.ws.send({
              type: 'custom',
              event: 'toml-config-updated',
              data: { file: filePath, fileName, timestamp: Date.now() }
            })

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, message: '文件已删除', fileName }))
          } catch (error) {
            console.error('删除配置文件失败:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: error.message }))
          }
        })
      })
      // ===== Article Markdown API =====
      // List markdown files under docs/articles
      server.middlewares.use('/api/article/list', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        try {
          ensureArticlesDir()
          const files = fs.readdirSync(articlesDir)
            .filter(file => file.endsWith('.md'))

          const articles = files.map(fileName => {
            const id = fileName.replace(/\.md$/i, '')
            const filePath = articleFilePath(id)
            const content = fs.readFileSync(filePath, 'utf-8')
            const stat = fs.statSync(filePath)
            const meta = parseArticleMeta(content, id)

            return {
              ...meta,
              fileName,
              updatedAt: stat.mtime.toISOString()
            }
          }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, articles }))
        } catch (error) {
          console.error('Failed to list article files:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ error: error.message }))
        }
      })

      // Read article markdown file
      server.middlewares.use('/api/article/read', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        try {
          const url = new URL(req.url, `http://${req.headers.host}`)
          const articleId = normalizeArticleId(url.searchParams.get('id') || '')

          if (!isValidArticleId(articleId)) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid article ID' }))
            return
          }

          const filePath = articleFilePath(articleId)
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Article file not found' }))
            return
          }

          const content = fs.readFileSync(filePath, 'utf-8')
          const parsed = fm(content)
          const meta = parseArticleMeta(content, articleId)

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            success: true,
            id: articleId,
            fileName: `${articleId}.md`,
            content,
            body: parsed.body || '',
            frontmatter: meta
          }))
        } catch (error) {
          console.error('Failed to read article file:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ error: error.message }))
        }
      })

      // Create/update article markdown file
      server.middlewares.use('/api/article/write', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}')
            const articleId = normalizeArticleId(data.id || '')
            const originalId = normalizeArticleId(data.originalId || '')
            const content = data.content

            if (!isValidArticleId(articleId)) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid article ID. Allowed: letters, numbers, -, _' }))
              return
            }

            if (originalId && !isValidArticleId(originalId)) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid original article ID' }))
              return
            }

            if (typeof content !== 'string') {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid article content' }))
              return
            }

            ensureArticlesDir()

            const targetPath = articleFilePath(articleId)
            const isRename = !!originalId && originalId !== articleId
            const oldPath = isRename ? articleFilePath(originalId) : null

            if (isRename && fs.existsSync(targetPath)) {
              res.statusCode = 409
              res.end(JSON.stringify({ error: 'Target article ID already exists' }))
              return
            }

            if (isRename && oldPath && fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath)
              invalidateArticle(oldPath, `${originalId}.md`)
            }

            fs.writeFileSync(targetPath, content, 'utf-8')
            invalidateArticle(targetPath, `${articleId}.md`)

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              id: articleId,
              fileName: `${articleId}.md`,
              message: 'Article saved'
            }))
          } catch (error) {
            console.error('Failed to write article file:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: error.message }))
          }
        })
      })

      // Delete article markdown file
      server.middlewares.use('/api/article/delete', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}')
            const articleId = normalizeArticleId(data.id || '')

            if (!isValidArticleId(articleId)) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid article ID' }))
              return
            }

            const filePath = articleFilePath(articleId)
            if (!fs.existsSync(filePath)) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Article file not found' }))
              return
            }

            fs.unlinkSync(filePath)
            invalidateArticle(filePath, `${articleId}.md`)

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              id: articleId,
              message: 'Article deleted'
            }))
          } catch (error) {
            console.error('Failed to delete article file:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: error.message }))
          }
        })
      })


      // ===== 专用 Profile 接口 =====
      // 读取 profile.toml
      server.middlewares.use('/api/profile/read', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end('Method Not Allowed'); return }
        try {
          const filePath = profilePath()
          if (!fs.existsSync(filePath)) { res.statusCode = 404; res.end(JSON.stringify({ error: 'profile.toml 不存在' })); return }
          const content = fs.readFileSync(filePath, 'utf-8')
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, fileName: 'profile.toml', content }))
        } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
      })

      // 写入 profile.toml
      server.middlewares.use('/api/profile/write', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method Not Allowed'); return }
        let body = ''
        req.on('data', c => body += c.toString())
        req.on('end', () => {
          try {
            const { content } = JSON.parse(body || '{}')
            if (typeof content !== 'string') { res.statusCode = 400; res.end(JSON.stringify({ error: '无效的内容' })); return }
            const filePath = profilePath()
            fs.writeFileSync(filePath, content, 'utf-8')
            console.log(' 已更新 profile.toml')
            invalidateToml(filePath)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, message: 'profile.toml 已更新' }))
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        })
      })

      // 删除 profile.toml
      server.middlewares.use('/api/profile/delete', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method Not Allowed'); return }
        try {
          const filePath = profilePath()
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            console.log(' 已删除 profile.toml')
            invalidateToml(filePath)
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, message: 'profile.toml 已删除（若存在）' }))
        } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
      })

      // 用 profile_default.toml 覆盖恢复 profile.toml
      server.middlewares.use('/api/profile/restore-default', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method Not Allowed'); return }
        try {
          const defPath = profileDefaultPath()
          if (!fs.existsSync(defPath)) { res.statusCode = 404; res.end(JSON.stringify({ error: 'profile_default.toml 不存在' })); return }
          const content = fs.readFileSync(defPath, 'utf-8')
          const filePath = profilePath()
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
          fs.writeFileSync(filePath, content, 'utf-8')
          console.log(' 已用 profile_default.toml 覆盖 profile.toml')
          invalidateToml(filePath)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, message: '已恢复默认 profile.toml' }))
        } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
      })
    }
  }
}
