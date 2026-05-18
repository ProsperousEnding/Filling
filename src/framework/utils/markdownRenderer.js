import MarkdownIt from 'markdown-it'
import { formatCodeBlockLanguageLabel, normalizeCodeBlockConfig, resolveCodeBlockLanguageConfig } from './codeBlockConfig.js'
import { normalizeMarkdownConfig } from './markdownConfig.js'

const rendererCache = new Map()
const plainRendererCache = new Map()

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value) {
  return escapeHtml(value)
}

function createBaseMarkdownRenderer() {
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true
  })

  const markdownValidateLink = markdown.validateLink.bind(markdown)
  markdown.validateLink = (url) => {
    const normalizedUrl = String(url || '').trim()
    return markdownValidateLink(normalizedUrl) && !/^(?:javascript|vbscript|data):/i.test(normalizedUrl)
  }

  return markdown
}

function normalizeCalloutType(type, calloutConfig) {
  const rawType = String(type || '').trim().toLowerCase()
  const aliasedType = calloutConfig.aliases?.[rawType] || rawType

  if (calloutConfig.labels?.[aliasedType]) {
    return aliasedType
  }

  return calloutConfig.defaultType || 'note'
}

function parseCalloutMarker(content = '', calloutConfig = {}) {
  const normalizedContent = String(content || '').replace(/\r\n/g, '\n').trim()
  const [firstLine = '', ...remainingLines] = normalizedContent.split('\n')
  const match = firstLine.trim().match(/^\[!([A-Za-z][\w-]*)\][+-]?(?:[ \t]+(.+))?$/)

  if (!match) {
    return null
  }

  const type = normalizeCalloutType(match[1], calloutConfig)
  const title = String(match[2] || '').trim() || calloutConfig.labels?.[type] || type
  const icon = calloutConfig.icons?.[type] || ''

  return {
    type,
    title,
    icon,
    showIcon: calloutConfig.showIcon !== false,
    markerLine: firstLine,
    remainingContent: remainingLines.join('\n').replace(/^\s+/, '')
  }
}

function stripCalloutMarkerChildren(children = [], markerLine = '') {
  if (!Array.isArray(children) || children.length === 0) {
    return children
  }

  const normalizedMarkerLine = String(markerLine || '').trim()
  const nextChildren = children.slice()

  if (nextChildren[0]?.type === 'text' && String(nextChildren[0].content || '').trim() === normalizedMarkerLine) {
    nextChildren.shift()
  }

  if (nextChildren[0]?.type === 'softbreak' || nextChildren[0]?.type === 'hardbreak') {
    nextChildren.shift()
  }

  return nextChildren
}

function findMatchingBlockquoteClose(tokens, startIndex) {
  let depth = 0

  for (let index = startIndex; index < tokens.length; index += 1) {
    if (tokens[index].type === 'blockquote_open') {
      depth += 1
    }

    if (tokens[index].type === 'blockquote_close') {
      depth -= 1

      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

function applyCalloutMarkdown(markdown, markdownConfig = {}) {
  const normalizedMarkdownConfig = normalizeMarkdownConfig(markdownConfig)
  const calloutConfig = normalizedMarkdownConfig.callouts

  if (!calloutConfig.enabled || calloutConfig.syntax !== 'github') {
    return
  }

  markdown.core.ruler.after('block', 'filling_callouts', (state) => {
    const tokens = state.tokens

    tokens.forEach((token, index) => {
      if (token.type !== 'blockquote_open') {
        return
      }

      const paragraphOpen = tokens[index + 1]
      const inline = tokens[index + 2]
      const paragraphClose = tokens[index + 3]

      if (
        paragraphOpen?.type !== 'paragraph_open'
        || inline?.type !== 'inline'
        || paragraphClose?.type !== 'paragraph_close'
      ) {
        return
      }

      const marker = parseCalloutMarker(inline.content, calloutConfig)

      if (!marker) {
        return
      }

      const closeIndex = findMatchingBlockquoteClose(tokens, index)

      if (closeIndex < 0) {
        return
      }

      token.meta = {
        ...(token.meta || {}),
        callout: marker
      }
      tokens[closeIndex].meta = {
        ...(tokens[closeIndex].meta || {}),
        callout: marker
      }
      if (marker.remainingContent) {
        inline.content = marker.remainingContent
        inline.children = stripCalloutMarkerChildren(inline.children, marker.markerLine)
        return
      }

      paragraphOpen.hidden = true
      inline.hidden = true
      paragraphClose.hidden = true
    })
  })

  const originalBlockquoteOpen = markdown.renderer.rules.blockquote_open
  const originalBlockquoteClose = markdown.renderer.rules.blockquote_close

  markdown.renderer.rules.blockquote_open = (tokens, index, options, env, self) => {
    const callout = tokens[index].meta?.callout

    if (!callout) {
      return originalBlockquoteOpen
        ? originalBlockquoteOpen(tokens, index, options, env, self)
        : self.renderToken(tokens, index, options)
    }

    const iconHtml = callout.showIcon && callout.icon
      ? `<span class="markdown-callout__icon" aria-hidden="true">${escapeHtml(callout.icon)}</span>`
      : ''

    return `<div class="markdown-callout markdown-callout--${escapeAttribute(callout.type)}" data-callout="${escapeAttribute(callout.type)}">\n`
      + `<div class="markdown-callout__title">${iconHtml}<span>${escapeHtml(callout.title)}</span></div>\n`
      + `<div class="markdown-callout__content">\n`
  }

  markdown.renderer.rules.blockquote_close = (tokens, index, options, env, self) => {
    const callout = tokens[index].meta?.callout

    if (!callout) {
      return originalBlockquoteClose
        ? originalBlockquoteClose(tokens, index, options, env, self)
        : self.renderToken(tokens, index, options)
    }

    return '</div>\n</div>\n'
  }
}

function countCodeLines(content = '') {
  const normalizedContent = String(content || '').replace(/\r\n/g, '\n')

  if (!normalizedContent) {
    return 0
  }

  return normalizedContent.replace(/\n$/, '').split('\n').length
}

function parseFenceInfo(info = '') {
  const parts = String(info || '').trim().split(/\s+/).filter(Boolean)
  const language = parts[0] || ''
  const attributes = parts.slice(1).reduce((result, part) => {
    const match = part.match(/^([\w-]+)=(["']?)(.*?)\2$/)

    if (match) {
      result[match[1]] = match[3]
      return result
    }

    if (/\.(\w[\w.-]*)$/.test(part) || part.includes('/')) {
      result.filename = part
    }

    return result
  }, {})

  return {
    language,
    filename: attributes.filename || attributes.file || attributes.title || ''
  }
}

function isEscaped(source = '', index = 0) {
  let backslashCount = 0

  for (let position = index - 1; position >= 0 && source[position] === '\\'; position -= 1) {
    backslashCount += 1
  }

  return backslashCount % 2 === 1
}

function findUnescapedSequence(source = '', sequence = '', startIndex = 0) {
  if (!sequence) {
    return -1
  }

  let index = String(source || '').indexOf(sequence, startIndex)

  while (index >= 0) {
    if (!isEscaped(source, index)) {
      return index
    }

    index = source.indexOf(sequence, index + sequence.length)
  }

  return -1
}

function readBlockLine(state, line) {
  const start = state.bMarks[line] + state.tShift[line]
  const end = state.eMarks[line]

  return state.src.slice(start, end)
}

function parseInlineMathAt(source = '', position = 0, mathConfig = {}) {
  if (
    mathConfig.inlineParentheses
    && source.startsWith('\\(', position)
    && !isEscaped(source, position)
  ) {
    const closeIndex = findUnescapedSequence(source, '\\)', position + 2)

    if (closeIndex > position + 2) {
      return {
        content: source.slice(position + 2, closeIndex).trim(),
        end: closeIndex + 2
      }
    }
  }

  if (
    mathConfig.inlineDollar
    && source[position] === '$'
    && source[position + 1] !== '$'
    && !isEscaped(source, position)
    && !/\s/.test(source[position + 1] || '')
  ) {
    let closeIndex = source.indexOf('$', position + 1)

    while (closeIndex >= 0) {
      if (
        source[closeIndex + 1] !== '$'
        && !isEscaped(source, closeIndex)
        && !/\s/.test(source[closeIndex - 1] || '')
      ) {
        return {
          content: source.slice(position + 1, closeIndex).trim(),
          end: closeIndex + 1
        }
      }

      closeIndex = source.indexOf('$', closeIndex + 1)
    }
  }

  return null
}

function createMathInlineRule(mathConfig = {}) {
  return (state, silent) => {
    const parsed = parseInlineMathAt(state.src, state.pos, mathConfig)

    if (!parsed || !parsed.content) {
      return false
    }

    if (!silent) {
      const token = state.push('math_inline', 'math', 0)
      token.content = parsed.content
    }

    state.pos = parsed.end
    return true
  }
}

function parseMathBlockOpening(line = '', mathConfig = {}) {
  const trimmedLine = String(line || '').trim()

  if (mathConfig.blockDollar && trimmedLine.startsWith('$$')) {
    return {
      opening: '$$',
      closing: '$$',
      content: trimmedLine.slice(2).trim()
    }
  }

  if (mathConfig.blockBrackets && trimmedLine.startsWith('\\[')) {
    return {
      opening: '\\[',
      closing: '\\]',
      content: trimmedLine.slice(2).trim()
    }
  }

  return null
}

function createMathBlockRule(mathConfig = {}) {
  return (state, startLine, endLine, silent) => {
    const opening = parseMathBlockOpening(readBlockLine(state, startLine), mathConfig)

    if (!opening) {
      return false
    }

    if (silent) {
      return true
    }

    const contentLines = []
    let nextLine = startLine + 1
    let closed = false

    if (opening.content) {
      const closeIndex = findUnescapedSequence(opening.content, opening.closing)

      if (closeIndex >= 0) {
        contentLines.push(opening.content.slice(0, closeIndex).trim())
        closed = true
      } else {
        contentLines.push(opening.content)
      }
    }

    if (!closed) {
      for (; nextLine < endLine; nextLine += 1) {
        const line = readBlockLine(state, nextLine)
        const closeIndex = findUnescapedSequence(line, opening.closing)

        if (closeIndex >= 0) {
          contentLines.push(line.slice(0, closeIndex).trimEnd())
          closed = true
          nextLine += 1
          break
        }

        contentLines.push(line)
      }
    }

    if (!closed) {
      return false
    }

    const token = state.push('math_block', 'math', 0)
    token.block = true
    token.content = contentLines.join('\n').trim()
    token.markup = opening.opening
    token.map = [startLine, nextLine]
    state.line = nextLine

    return true
  }
}

function buildMathHtml(content = '', displayMode = false, mathConfig = {}) {
  const normalizedContent = String(content || '').trim()

  if (!normalizedContent) {
    return ''
  }

  const tagName = displayMode ? 'div' : 'span'
  const className = displayMode
    ? 'markdown-math markdown-math--block'
    : 'markdown-math markdown-math--inline'

  return `<${tagName} class="${className}" data-math-engine="${escapeAttribute(mathConfig.engine || 'katex')}" data-display-mode="${displayMode ? 'true' : 'false'}" data-tex="${escapeAttribute(normalizedContent)}">${escapeHtml(normalizedContent)}</${tagName}>`
}

function applyMathMarkdown(markdown, markdownConfig = {}) {
  const normalizedMarkdownConfig = normalizeMarkdownConfig(markdownConfig)
  const mathConfig = normalizedMarkdownConfig.math

  if (!mathConfig.enabled) {
    return
  }

  if (mathConfig.blockDollar || mathConfig.blockBrackets) {
    markdown.block.ruler.before(
      'paragraph',
      'filling_math_block',
      createMathBlockRule(mathConfig),
      { alt: ['paragraph', 'reference', 'blockquote', 'list'] }
    )
  }

  if (mathConfig.inlineDollar || mathConfig.inlineParentheses) {
    markdown.inline.ruler.before('escape', 'filling_math_inline', createMathInlineRule(mathConfig))
  }

  markdown.renderer.rules.math_inline = (tokens, index) => (
    buildMathHtml(tokens[index].content, false, mathConfig)
  )
  markdown.renderer.rules.math_block = (tokens, index) => (
    `${buildMathHtml(tokens[index].content, true, mathConfig)}\n`
  )
}

function normalizeFenceLanguage(language = '') {
  return String(language || '')
    .trim()
    .toLowerCase()
    .replace(/^language-/, '')
}

function isMermaidLanguage(language = '', mermaidConfig = {}) {
  const normalizedLanguage = normalizeFenceLanguage(language)

  return mermaidConfig.enabled && ['mermaid', 'mmd'].includes(normalizedLanguage)
}

function buildMermaidHtml(content = '') {
  const normalizedContent = String(content || '').trim()

  if (!normalizedContent) {
    return ''
  }

  return `
<div class="markdown-mermaid" data-mermaid-code="${escapeAttribute(normalizedContent)}">
  <pre class="markdown-mermaid__fallback"><code>${escapeHtml(normalizedContent)}</code></pre>
</div>`.trim()
}

function splitEscapedCodeLines(codeHtml = '', content = '') {
  const rawLines = String(content || '').replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n')
  const escapedLines = String(codeHtml || '').replace(/\n$/, '').split('\n')
  const lineCount = Math.max(rawLines.length, escapedLines.length)

  return Array.from({ length: lineCount }, (_, index) => ({
    raw: rawLines[index] || '',
    html: escapedLines[index] || ''
  }))
}

function resolveCodeLineType(rawLine = '', language = '', markDiffLines = true) {
  if (!markDiffLines) {
    return ''
  }

  const normalizedLanguage = String(language || '').toLowerCase()
  const isDiff = normalizedLanguage === 'diff' || normalizedLanguage === 'patch'

  if (!isDiff) {
    return ''
  }

  if (/^\+(?!\+\+)/.test(rawLine)) {
    return 'add'
  }

  if (/^-(?!--)/.test(rawLine)) {
    return 'remove'
  }

  return ''
}

function buildCodeLineHtml(codeHtml, content, language, codeBlockConfig) {
  const lines = splitEscapedCodeLines(codeHtml, content)
  const start = codeBlockConfig.lineNumberStart

  return lines.map((line, index) => {
    const lineType = resolveCodeLineType(line.raw, language, codeBlockConfig.markDiffLines)
    const classes = [
      'markdown-code-block__line',
      lineType ? `is-${lineType}` : ''
    ].filter(Boolean).join(' ')

    return [
      `<span class="${classes}">`,
      codeBlockConfig.showLineNumbers
        ? `<span class="markdown-code-block__line-number" aria-hidden="true">${escapeHtml(String(start + index))}</span>`
        : '',
      `<span class="markdown-code-block__line-content">${line.html || ' '}</span>`,
      '</span>'
    ].join('')
  }).join('')
}

function buildCodeBlockHtml(codeHtml, content, language, codeBlockConfig, { fenced = true, filename = '' } = {}) {
  if (!codeBlockConfig.enabled) {
    return fenced
      ? `<pre><code${language ? ` class="language-${escapeAttribute(language)}"` : ''}>${codeHtml}</code></pre>`
      : `<pre><code>${codeHtml}</code></pre>`
  }

  const languageLabel = codeBlockConfig.showLanguage
    ? formatCodeBlockLanguageLabel(language)
    : ''
  const lineCount = countCodeLines(content)
  const isCollapsible = codeBlockConfig.collapsible && lineCount >= codeBlockConfig.collapseThresholdLines
  const resolvedFilename = codeBlockConfig.showFilename && fenced
    ? String(filename || '')
    : ''
  const wrapperClasses = [
    'markdown-code-block',
    `theme-${codeBlockConfig.theme}`,
    `dark-theme-${codeBlockConfig.darkTheme}`,
    codeBlockConfig.showLineNumbers ? 'has-line-numbers' : '',
    codeBlockConfig.wrapLongLines ? 'is-wrapped' : '',
    isCollapsible ? 'is-collapsible is-collapsed' : ''
  ].filter(Boolean).join(' ')
  const styleParts = []
  const lineHtml = buildCodeLineHtml(codeHtml, content, language, codeBlockConfig)

  if (codeBlockConfig.maxHeight) {
    styleParts.push(`--code-block-max-height: ${codeBlockConfig.maxHeight}`)
  }

  if (isCollapsible) {
    styleParts.push(`--code-block-collapsed-lines: ${codeBlockConfig.previewLines}`)
    styleParts.push(`--code-block-collapsed-max-height: calc(${codeBlockConfig.previewLines} * 1.65em + 3.2rem)`)
  }

  return `
<div class="${wrapperClasses}"${language ? ` data-language="${escapeAttribute(language)}"` : ''}${styleParts.length > 0 ? ` style="${escapeAttribute(styleParts.join('; '))}"` : ''}>
  <div class="markdown-code-block__toolbar">
    <div class="markdown-code-block__meta">
      ${resolvedFilename ? `<span class="markdown-code-block__filename">${escapeHtml(resolvedFilename)}</span>` : ''}
      ${languageLabel ? `<span class="markdown-code-block__language">${escapeHtml(languageLabel)}</span>` : ''}
      ${lineCount > 0 ? `<span class="markdown-code-block__lines">${escapeHtml(String(lineCount))} 行</span>` : ''}
    </div>
    <div class="markdown-code-block__actions">
      ${codeBlockConfig.showCopyButton
        ? `<button type="button" class="markdown-code-block__button markdown-code-block__copy" data-copy-label="${escapeAttribute(codeBlockConfig.copyLabel)}" data-copied-label="${escapeAttribute(codeBlockConfig.copiedLabel)}">${escapeHtml(codeBlockConfig.copyLabel)}</button>`
        : ''}
      ${isCollapsible
        ? `<button type="button" class="markdown-code-block__button markdown-code-block__toggle" data-expand-label="${escapeAttribute(codeBlockConfig.expandLabel)}" data-collapse-label="${escapeAttribute(codeBlockConfig.collapseLabel)}" aria-expanded="false">${escapeHtml(codeBlockConfig.expandLabel)}</button>`
        : ''}
    </div>
  </div>
  <pre class="markdown-code-block__pre"><code${language ? ` class="language-${escapeAttribute(language)}"` : ''}>${lineHtml}</code></pre>
</div>`.trim()
}

function createConfiguredMarkdownRenderer(codeBlockConfig = {}, markdownConfig = {}) {
  const normalizedCodeBlockConfig = normalizeCodeBlockConfig(codeBlockConfig)
  const normalizedMarkdownConfig = normalizeMarkdownConfig(markdownConfig)
  const markdown = createBaseMarkdownRenderer()
  applyCalloutMarkdown(markdown, normalizedMarkdownConfig)
  applyMathMarkdown(markdown, normalizedMarkdownConfig)
  const originalFence = markdown.renderer.rules.fence
  const originalCodeBlock = markdown.renderer.rules.code_block

  markdown.renderer.rules.fence = (tokens, index, options, env, self) => {
    const token = tokens[index]
    const info = String(token.info || '').trim()
    const { language, filename } = parseFenceInfo(info)

    if (isMermaidLanguage(language, normalizedMarkdownConfig.mermaid)) {
      return buildMermaidHtml(token.content)
    }

    const resolvedCodeBlockConfig = resolveCodeBlockLanguageConfig(normalizedCodeBlockConfig, language)
    const rendered = originalFence
      ? originalFence(tokens, index, options, env, self)
      : self.renderToken(tokens, index, options)
    const codeHtml = rendered
      .replace(/^<pre><code[^>]*>/, '')
      .replace(/<\/code><\/pre>\s*$/, '')

    return buildCodeBlockHtml(codeHtml, token.content, language, resolvedCodeBlockConfig, { fenced: true, filename })
  }

  markdown.renderer.rules.code_block = (tokens, index) => {
    const token = tokens[index]
    const codeHtml = originalCodeBlock
      ? originalCodeBlock(tokens, index, markdown.options, {}, markdown.renderer)
          .replace(/^<pre><code>/, '')
          .replace(/<\/code><\/pre>\s*$/, '')
      : escapeHtml(token.content)

    return buildCodeBlockHtml(codeHtml, token.content, '', normalizedCodeBlockConfig, { fenced: false })
  }

  return markdown
}

function createPlainMarkdownRenderer(markdownConfig = {}) {
  const normalizedMarkdownConfig = normalizeMarkdownConfig(markdownConfig)
  const markdown = createBaseMarkdownRenderer()
  applyCalloutMarkdown(markdown, normalizedMarkdownConfig)
  applyMathMarkdown(markdown, normalizedMarkdownConfig)
  return markdown
}

function getRendererCacheKey(codeBlockConfig = {}, markdownConfig = {}) {
  return JSON.stringify({
    codeBlock: normalizeCodeBlockConfig(codeBlockConfig),
    markdown: normalizeMarkdownConfig(markdownConfig)
  })
}

function getPlainRendererCacheKey(markdownConfig = {}) {
  return JSON.stringify(normalizeMarkdownConfig(markdownConfig))
}

export function renderMarkdown(content = '', { codeBlockConfig = null, markdownConfig = null, enhanceCodeBlocks = true } = {}) {
  const normalizedContent = String(content || '')

  if (!enhanceCodeBlocks) {
    const plainCacheKey = getPlainRendererCacheKey(markdownConfig || {})

    if (!plainRendererCache.has(plainCacheKey)) {
      plainRendererCache.set(plainCacheKey, createPlainMarkdownRenderer(markdownConfig || {}))
    }

    return plainRendererCache.get(plainCacheKey).render(normalizedContent)
  }

  const cacheKey = getRendererCacheKey(codeBlockConfig || {}, markdownConfig || {})

  if (!rendererCache.has(cacheKey)) {
    rendererCache.set(cacheKey, createConfiguredMarkdownRenderer(codeBlockConfig || {}, markdownConfig || {}))
  }

  return rendererCache.get(cacheKey).render(normalizedContent)
}
