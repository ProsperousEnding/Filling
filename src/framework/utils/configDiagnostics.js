import { SEEDED_COVER_STYLES, normalizeSeededCoverStyle } from './articleCover.js'
import { normalizeAnalyticsProvider } from './analyticsConfig.js'
import { BUILT_IN_FONT_PRESETS } from './fontConfig.js'

const CONFIG_KEYS = Object.freeze({
  site: new Set([
    'title', 'subtitle', 'description', 'site_url', 'seo', 'header', 'footer',
    'footer_text', 'footer_note', 'footer_html', 'footer_snippet_html', 'features',
    'sidebar', 'routing', 'menus', 'pagination', 'home_articles', 'page_layouts'
  ]),
  profile: new Set([
    'display_name', 'username', 'tagline', 'bio', 'avatar_url', 'location',
    'website', 'display', 'social_links'
  ]),
  theme: new Set(['current_preset', 'css_file', 'js_file', 'presets']),
  links: new Set(['page', 'friend_links']),
  announcement: new Set([
    'enabled', 'id', 'title', 'content', 'link_text', 'link_url', 'dismissible', 'variant'
  ]),
  comment: new Set([
    'enabled', 'provider', 'title', 'description', 'not_ready_text', 'giscus', 'utterances'
  ]),
  sponsor: new Set([
    'enabled', 'show', 'show_on_articles', 'page_enabled', 'title', 'description',
    'button_text', 'button_url', 'button_note', 'page_kicker', 'page_title',
    'page_description', 'supporters_title', 'supporters_description', 'methods',
    'supporters', 'backers', 'page'
  ]),
  license: new Set(['enabled', 'name', 'label', 'title', 'url', 'href', 'default']),
  analytics: new Set([
    'enabled', 'provider', 'respect_dnt', 'track_localhost', 'umami', 'plausible',
    'google_analytics', 'clarity'
  ]),
  font: new Set([
    'enabled', 'preset', 'current_preset', 'preload', 'base_size', 'families',
    'dark_families', 'presets', 'faces'
  ]),
  code_block: new Set([
    'enabled', 'show_language', 'show_filename', 'show_copy_button',
    'show_line_numbers', 'line_number_start', 'theme', 'dark_theme', 'copy_label',
    'copied_label', 'wrap_long_lines', 'max_height', 'collapsible',
    'collapse_threshold_lines', 'preview_lines', 'expand_label', 'collapse_label',
    'mark_diff_lines', 'languages'
  ]),
  markdown: new Set(['enabled', 'callouts', 'mermaid', 'math']),
  background: new Set([
    'enabled', 'mode', 'gradient_light', 'gradient_dark', 'image', 'dark_image',
    'image_dark', 'overlay_light', 'overlay_dark', 'position', 'size', 'repeat',
    'attachment', 'opacity'
  ]),
  cover: new Set([
    'enabled', 'fallback', 'fallback_image', 'image', 'seeded_width', 'seeded_height',
    'seeded_format', 'seeded_style', 'seeded_anime_url', 'source_urls', 'style_urls',
    'list', 'detail'
  ]),
  guestbook: new Set([
    'enabled', 'kicker', 'title', 'description', 'guidelines', 'template',
    'contact_label', 'contact_url', 'comment_title', 'comment_description',
    'comment_not_ready_text', 'comment', 'page'
  ])
})

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function createDiagnostic(level, code, path, message) {
  return { level, code, path, message }
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function validateKnownKeys(configs, diagnostics) {
  Object.entries(configs).forEach(([namespace, config]) => {
    const allowedKeys = CONFIG_KEYS[namespace]

    if (!allowedKeys || !isPlainObject(config)) {
      return
    }

    Object.keys(config).forEach((key) => {
      if (!allowedKeys.has(key)) {
        diagnostics.push(createDiagnostic(
          'warning',
          'unknown-config-field',
          `${namespace}.${key}`,
          `Unknown field "${key}"; check the spelling or remove it.`
        ))
      }
    })
  })
}

function validateEnum(value, values, path, diagnostics) {
  if (!hasValue(value)) {
    return
  }

  const normalized = String(value).trim().toLowerCase()
  if (!values.includes(normalized)) {
    diagnostics.push(createDiagnostic(
      'error',
      'invalid-config-value',
      path,
      `Expected one of ${values.map(item => `"${item}"`).join(', ')}, received "${value}".`
    ))
  }
}

function validatePositiveInteger(value, path, diagnostics) {
  if (value === undefined) {
    return
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    diagnostics.push(createDiagnostic(
      'error',
      'invalid-positive-integer',
      path,
      `Expected a positive integer, received "${value}".`
    ))
  }
}

function requireFields(source, fields, basePath, diagnostics) {
  fields.forEach((field) => {
    if (!hasValue(source?.[field])) {
      diagnostics.push(createDiagnostic(
        'error',
        'missing-required-config-field',
        `${basePath}.${field}`,
        `This field is required when ${basePath} is enabled.`
      ))
    }
  })
}

function validateSiteConfig(site, diagnostics) {
  validateEnum(site?.home_articles?.mode, ['latest', 'featured', 'sticky', 'mixed'], 'site.home_articles.mode', diagnostics)
  validatePositiveInteger(site?.home_articles?.page_size, 'site.home_articles.page_size', diagnostics)
  validatePositiveInteger(site?.pagination?.page_size, 'site.pagination.page_size', diagnostics)
  validateEnum(site?.features?.sidebar_position, ['left', 'right', 'hidden', 'none'], 'site.features.sidebar_position', diagnostics)

  const leadingVisual = site?.header?.leading_visual
  validateEnum(leadingVisual?.type, ['dots', 'image'], 'site.header.leading_visual.type', diagnostics)
  if (leadingVisual?.type === 'image' && !hasValue(leadingVisual.src)) {
    requireFields(leadingVisual, ['src'], 'site.header.leading_visual', diagnostics)
  }
}

function validateThemeConfig(theme, diagnostics) {
  const preset = String(theme?.current_preset || '').trim()
  if (!preset) {
    return
  }

  if (!isPlainObject(theme?.presets?.[preset]) && !hasValue(theme.css_file)) {
    diagnostics.push(createDiagnostic(
      'error',
      'missing-theme-preset',
      'theme.current_preset',
      `Theme preset "${preset}" is not defined under theme.presets.`
    ))
  }
}

function validateFontConfig(font, diagnostics) {
  const preset = String(font?.preset || font?.current_preset || '').trim()
  if (!preset) {
    return
  }

  const customPresets = isPlainObject(font?.presets) ? font.presets : {}
  if (!BUILT_IN_FONT_PRESETS[preset] && !isPlainObject(customPresets[preset])) {
    diagnostics.push(createDiagnostic(
      'error',
      'missing-font-preset',
      'font.preset',
      `Font preset "${preset}" is not built in and is not defined under font.presets.`
    ))
  }
}

function validateCommentConfig(comment, diagnostics) {
  const provider = String(comment?.provider || 'giscus').trim().toLowerCase()
  validateEnum(provider, ['giscus', 'utterances'], 'comment.provider', diagnostics)

  const enabled = comment?.enabled === true || (comment?.enabled !== false && hasValue(comment?.provider))
  if (!enabled || !['giscus', 'utterances'].includes(provider)) {
    return
  }

  if (provider === 'giscus') {
    requireFields(comment?.giscus, ['repo', 'repo_id', 'category', 'category_id'], 'comment.giscus', diagnostics)
    if (comment?.giscus?.mapping === 'specific') {
      requireFields(comment.giscus, ['term'], 'comment.giscus', diagnostics)
    }
    validateEnum(comment?.giscus?.mapping, ['pathname', 'url', 'title', 'og:title', 'specific'], 'comment.giscus.mapping', diagnostics)
    validateEnum(comment?.giscus?.input_position, ['top', 'bottom'], 'comment.giscus.input_position', diagnostics)
    validateEnum(comment?.giscus?.loading, ['lazy', 'eager'], 'comment.giscus.loading', diagnostics)
  } else {
    requireFields(comment?.utterances, ['repo'], 'comment.utterances', diagnostics)
  }
}

function getLegacyAnalyticsProviders(analytics) {
  return [
    ['umami', analytics?.umami],
    ['plausible', analytics?.plausible],
    ['google_analytics', analytics?.google_analytics],
    ['clarity', analytics?.clarity]
  ]
    .filter(([, config]) => config?.enabled === true)
    .map(([provider]) => provider)
}

function validateAnalyticsConfig(analytics, diagnostics) {
  const rawProvider = String(analytics?.provider || '').trim()
  const provider = normalizeAnalyticsProvider(rawProvider)

  if (rawProvider && !provider) {
    validateEnum(rawProvider, ['umami', 'plausible', 'google_analytics', 'clarity'], 'analytics.provider', diagnostics)
    return
  }

  if (analytics?.enabled === false) {
    return
  }

  const providers = provider
    ? [provider]
    : analytics?.enabled === true
      ? getLegacyAnalyticsProviders(analytics)
      : []

  if (analytics?.enabled === true && providers.length === 0) {
    diagnostics.push(createDiagnostic(
      'error',
      'missing-analytics-provider',
      'analytics.provider',
      'Select one provider, or enable a provider section when using the legacy format.'
    ))
  }

  providers.forEach((providerName) => {
    const requirements = {
      umami: ['website_id'],
      plausible: ['domain'],
      google_analytics: ['measurement_id'],
      clarity: ['project_id']
    }
    requireFields(analytics?.[providerName], requirements[providerName], `analytics.${providerName}`, diagnostics)
  })
}

function validateBackgroundConfig(background, diagnostics) {
  validateEnum(background?.mode, ['none', 'gradient', 'image'], 'background.mode', diagnostics)
  if (background?.enabled === true && background?.mode === 'image' && !hasValue(background.image)) {
    requireFields(background, ['image'], 'background', diagnostics)
  }
}

function validateCoverConfig(cover, diagnostics) {
  validateEnum(cover?.fallback, ['none', 'seeded', 'image'], 'cover.fallback', diagnostics)
  validateEnum(cover?.detail?.display_mode, ['image', 'header-background', 'page-background'], 'cover.detail.display_mode', diagnostics)
  validateEnum(cover?.detail?.page_background?.content_style, ['transparent', 'glass'], 'cover.detail.page_background.content_style', diagnostics)

  if (cover?.fallback === 'image' && !hasValue(cover.fallback_image || cover.image)) {
    requireFields(cover, ['fallback_image'], 'cover', diagnostics)
  }

  if (hasValue(cover?.seeded_style)) {
    const style = normalizeSeededCoverStyle(cover.seeded_style, '')
    const customStyles = new Set([
      ...Object.keys(isPlainObject(cover.source_urls) ? cover.source_urls : {}),
      ...Object.keys(isPlainObject(cover.style_urls) ? cover.style_urls : {})
    ].map(value => normalizeSeededCoverStyle(value, '')))

    if (!SEEDED_COVER_STYLES.includes(style) && !customStyles.has(style)) {
      diagnostics.push(createDiagnostic(
        'error',
        'unknown-cover-style',
        'cover.seeded_style',
        `Cover style "${cover.seeded_style}" has no built-in or configured source.`
      ))
    }
  }
}

function validateMarkdownConfig(markdown, diagnostics) {
  validateEnum(markdown?.callouts?.syntax, ['github'], 'markdown.callouts.syntax', diagnostics)
  validateEnum(markdown?.mermaid?.theme, ['default', 'base', 'dark', 'forest', 'neutral'], 'markdown.mermaid.theme', diagnostics)
  validateEnum(markdown?.mermaid?.dark_theme, ['default', 'base', 'dark', 'forest', 'neutral'], 'markdown.mermaid.dark_theme', diagnostics)
  validateEnum(markdown?.mermaid?.security_level, ['strict', 'loose', 'antiscript', 'sandbox'], 'markdown.mermaid.security_level', diagnostics)
  validateEnum(markdown?.math?.engine, ['katex'], 'markdown.math.engine', diagnostics)
}

function validateCodeBlockConfig(codeBlock, diagnostics) {
  const validateSettings = (settings, path) => {
    validateEnum(settings?.theme, ['default', 'github', 'dracula'], `${path}.theme`, diagnostics)
    validateEnum(settings?.dark_theme, ['default', 'github', 'dracula'], `${path}.dark_theme`, diagnostics)
    validatePositiveInteger(settings?.line_number_start, `${path}.line_number_start`, diagnostics)
    validatePositiveInteger(settings?.collapse_threshold_lines, `${path}.collapse_threshold_lines`, diagnostics)
    validatePositiveInteger(settings?.preview_lines, `${path}.preview_lines`, diagnostics)
  }

  validateSettings(codeBlock, 'code_block')
  Object.entries(isPlainObject(codeBlock?.languages) ? codeBlock.languages : {})
    .forEach(([language, settings]) => validateSettings(settings, `code_block.languages.${language}`))
}

function validateSponsorConfig(sponsor, diagnostics) {
  if (sponsor?.show === undefined) {
    return
  }

  if (!Array.isArray(sponsor.show)) {
    diagnostics.push(createDiagnostic(
      'error',
      'invalid-sponsor-targets',
      'sponsor.show',
      'Expected an array containing "articles" and/or "page".'
    ))
    return
  }

  sponsor.show.forEach((target, index) => {
    validateEnum(target, ['article', 'articles', 'page'], `sponsor.show[${index}]`, diagnostics)
  })
}

export function getConfigDiagnostics(configs = {}) {
  const source = isPlainObject(configs) ? configs : {}
  const diagnostics = []

  validateKnownKeys(source, diagnostics)
  validateSiteConfig(source.site, diagnostics)
  validateThemeConfig(source.theme, diagnostics)
  validateFontConfig(source.font, diagnostics)
  validateCommentConfig(source.comment, diagnostics)
  validateAnalyticsConfig(source.analytics, diagnostics)
  validateBackgroundConfig(source.background, diagnostics)
  validateCoverConfig(source.cover, diagnostics)
  validateMarkdownConfig(source.markdown, diagnostics)
  validateCodeBlockConfig(source.code_block, diagnostics)
  validateSponsorConfig(source.sponsor, diagnostics)
  validateEnum(source.announcement?.variant, ['info', 'success', 'warning'], 'announcement.variant', diagnostics)

  return diagnostics
}
