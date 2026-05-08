import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  configureBlogRoutePatterns,
  getArchivePath,
  getArchiveYearPath,
  getArticlePath,
  getArticlesPath,
  getArticlesPagePath,
  getBlogPathPatterns,
  getCategoriesPath,
  getCategoryPath,
  getCategoryPagePath,
  getHomePath,
  getNotFoundPath,
  getSearchPath,
  getTagPath,
  getTagPagePath,
  getTagsPath
} from '../src/framework/router/routeManifest.js'
import { parseArticleDetail } from '../src/framework/adapters/markdown/articleSourceParser.js'
import {
  getCustomMenuPages,
  getMaxMenuSourceLimit,
  normalizeMenuConfig,
  resolveMenuPage,
  resolveHeaderMenuGroups,
  resolveSidebarMenuSections
} from '../src/framework/utils/menuConfig.js'
import { normalizeSidebarLayout, resolveSidebarSections } from '../src/framework/utils/sidebarLayout.js'
import {
  normalizeMenuContentPath,
  parseMenuCollectionDetail,
  parseMenuContextSource,
  sortMenuCollectionItems
} from '../src/framework/adapters/markdown/menuPageSourceParser.js'
import {
  resolveBuiltInPageComponentKey,
  resolveMenuPageComponentKey
} from '../src/framework/utils/pageComponentConfig.js'
import { resolveOutdatedNotice } from '../src/framework/utils/articleMeta.js'
import { normalizeThemeAssetPath } from '../src/framework/utils/themeAsset.js'
import { applyConfigEnvOverrides } from '../src/framework/config/configEnvOverrides.js'
import { parseToml } from '../src/framework/utils/tomlParser.js'
import contentIndexData from '../src/framework/generated/contentIndex.generated.js'

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url))
const DIST_DIR = path.join(ROOT_DIR, 'dist')
const CONFIG_DIR = path.join(ROOT_DIR, 'blog', 'config')
const ARTICLES_DIR = path.join(ROOT_DIR, 'blog', 'content', 'articles')
const GISCUS_MAPPING_VALUES = new Set(['pathname', 'url', 'title', 'og:title', 'specific'])
const GISCUS_INPUT_POSITION_VALUES = new Set(['top', 'bottom'])
const GISCUS_LOADING_VALUES = new Set(['lazy', 'eager'])

const STATIC_STYLE = `
<style id="vue-blog-static-preview">
  :root {
    color-scheme: light;
    --ssg-bg: #f8fafc;
    --ssg-panel: #ffffff;
    --ssg-panel-muted: #f8fafc;
    --ssg-text: #0f172a;
    --ssg-text-soft: #475569;
    --ssg-text-muted: #64748b;
    --ssg-line: rgba(148, 163, 184, 0.24);
    --ssg-accent: #2563eb;
    --ssg-accent-soft: rgba(37, 99, 235, 0.1);
    --ssg-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  }

  body {
    margin: 0;
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 28%, #ffffff 100%);
    color: var(--ssg-text);
  }

  .ssg-shell {
    min-height: 100vh;
  }

  .ssg-container {
    width: min(1120px, calc(100vw - 32px));
    margin: 0 auto;
  }

  .ssg-header {
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(14px);
    background: rgba(255, 255, 255, 0.84);
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  }

  .ssg-header-inner,
  .ssg-footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 18px 0;
  }

  .ssg-brand {
    color: var(--ssg-text);
    text-decoration: none;
  }

  .ssg-brand-title {
    display: block;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .ssg-brand-description {
    display: block;
    margin-top: 4px;
    color: var(--ssg-text-muted);
    font-size: 0.92rem;
  }

  .ssg-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .ssg-nav a,
  .ssg-inline-link,
  .ssg-tag,
  .ssg-category {
    color: var(--ssg-accent);
    text-decoration: none;
  }

  .ssg-nav a:hover,
  .ssg-inline-link:hover,
  .ssg-tag:hover,
  .ssg-category:hover,
  .ssg-article-link:hover,
  .ssg-sidebar-link:hover,
  .ssg-footer-link:hover {
    text-decoration: underline;
  }

  .ssg-main {
    padding: 32px 0 56px;
  }

  .ssg-announcement {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    width: min(1120px, calc(100vw - 32px));
    margin: 0 auto 22px;
    padding: 16px 18px;
    border-radius: 20px;
    border: 1px solid rgba(191, 219, 254, 0.95);
    background:
      radial-gradient(circle at top right, rgba(191, 219, 254, 0.45), transparent 32%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 252, 0.94));
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
  }

  .ssg-announcement[data-variant='success'] {
    border-color: rgba(167, 243, 208, 0.92);
    background:
      radial-gradient(circle at top right, rgba(167, 243, 208, 0.36), transparent 32%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(240, 253, 244, 0.94));
  }

  .ssg-announcement[data-variant='warning'] {
    border-color: rgba(253, 230, 138, 0.96);
    background:
      radial-gradient(circle at top right, rgba(253, 230, 138, 0.34), transparent 32%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(255, 251, 235, 0.94));
  }

  .ssg-announcement-copy {
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .ssg-announcement-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 3.1rem;
    min-height: 1.8rem;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    background: rgba(37, 99, 235, 0.1);
    color: var(--ssg-accent);
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .ssg-announcement[data-variant='success'] .ssg-announcement-badge {
    background: rgba(16, 185, 129, 0.12);
    color: rgb(5, 150, 105);
  }

  .ssg-announcement[data-variant='warning'] .ssg-announcement-badge {
    background: rgba(245, 158, 11, 0.14);
    color: rgb(217, 119, 6);
  }

  .ssg-announcement-title {
    display: block;
    color: var(--ssg-text);
    font-size: 0.94rem;
    line-height: 1.5;
  }

  .ssg-announcement-text {
    margin: 2px 0 0;
    color: var(--ssg-text-soft);
    font-size: 0.9rem;
    line-height: 1.65;
  }

  .ssg-announcement-link {
    color: var(--ssg-accent);
    text-decoration: none;
    font-size: 0.82rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .ssg-announcement-link:hover {
    text-decoration: underline;
  }

  .ssg-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 32px;
    align-items: start;
  }

  .ssg-layout.is-sidebar-left {
    grid-template-columns: 300px minmax(0, 1fr);
  }

  .ssg-layout.is-sidebar-left .ssg-sidebar {
    order: 0;
  }

  .ssg-layout.is-sidebar-left .ssg-content {
    order: 1;
  }

  .ssg-content,
  .ssg-sidebar-card,
  .ssg-footer {
    background: var(--ssg-panel);
    border: 1px solid var(--ssg-line);
    border-radius: 20px;
    box-shadow: var(--ssg-shadow);
  }

  .ssg-content {
    padding: 28px;
  }

  .ssg-page-title {
    margin: 0;
    font-size: clamp(1.8rem, 3vw, 2.5rem);
    line-height: 1.12;
    letter-spacing: -0.03em;
    overflow-wrap: anywhere;
  }

  .ssg-page-description {
    margin: 12px 0 0;
    color: var(--ssg-text-soft);
    line-height: 1.7;
  }

  .ssg-page-header {
    margin-bottom: 28px;
    padding-bottom: 22px;
    border-bottom: 1px solid var(--ssg-line);
  }

  .ssg-list {
    display: grid;
    gap: 18px;
  }

  .ssg-card {
    padding: 18px 20px;
    border-radius: 18px;
    border: 1px solid var(--ssg-line);
    background: var(--ssg-panel-muted);
  }

  .ssg-article-link {
    color: var(--ssg-text);
    text-decoration: none;
    font-size: 1.06rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    overflow-wrap: anywhere;
  }

  .ssg-meta,
  .ssg-meta a,
  .ssg-summary,
  .ssg-footer-copy,
  .ssg-footer-note,
  .ssg-footer-snippet,
  .ssg-sidebar-copy,
  .ssg-sidebar-meta {
    color: var(--ssg-text-muted);
    font-size: 0.94rem;
    line-height: 1.7;
  }

  .ssg-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin-top: 10px;
  }

  .ssg-summary {
    margin: 12px 0 0;
    overflow-wrap: anywhere;
  }

  .ssg-cover {
    display: block;
    width: 100%;
    max-height: 420px;
    margin: 0 0 24px;
    border-radius: 18px;
    object-fit: cover;
    background: #e2e8f0;
  }

  .ssg-prose {
    color: var(--ssg-text);
    line-height: 1.85;
  }

  .ssg-license-card {
    margin-top: 28px;
    padding: 16px 18px;
    border-radius: 18px;
    border: 1px solid var(--ssg-line);
    background: var(--ssg-panel-muted);
  }

  .ssg-license-label {
    color: var(--ssg-text-muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .ssg-license-link {
    display: inline-flex;
    margin-top: 6px;
    color: var(--ssg-text);
    text-decoration: none;
    font-weight: 600;
  }

  a.ssg-license-link:hover {
    color: var(--ssg-accent);
    text-decoration: underline;
  }

  .ssg-outdated-card {
    margin: 0 0 28px;
    padding: 16px 18px;
    border-radius: 18px;
    border: 1px solid rgba(253, 230, 138, 0.95);
    background: linear-gradient(180deg, rgba(255, 251, 235, 0.98), rgba(254, 249, 195, 0.78));
  }

  .ssg-outdated-label {
    color: rgb(180, 83, 9);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .ssg-outdated-copy {
    margin: 8px 0 0;
    color: rgb(120, 53, 15);
    line-height: 1.8;
  }

  .ssg-comments-shell {
    margin-top: 28px;
    padding: 18px 20px;
    border-radius: 20px;
    border: 1px solid var(--ssg-line);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  }

  .ssg-comments-kicker {
    margin: 0 0 8px;
    color: var(--ssg-text-muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .ssg-comments-title {
    margin: 0;
    color: var(--ssg-text);
    font-size: 1.24rem;
    line-height: 1.35;
    letter-spacing: -0.02em;
  }

  .ssg-comments-description {
    margin: 10px 0 0;
    color: var(--ssg-text-soft);
    line-height: 1.75;
  }

  .ssg-sponsor-shell {
    margin-top: 28px;
    padding: 18px 20px;
    border-radius: 20px;
    border: 1px solid var(--ssg-line);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  }

  .ssg-sponsor-kicker {
    margin: 0 0 8px;
    color: var(--ssg-text-muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .ssg-sponsor-title {
    margin: 0;
    color: var(--ssg-text);
    font-size: 1.24rem;
    line-height: 1.35;
    letter-spacing: -0.02em;
  }

  .ssg-sponsor-description {
    margin: 10px 0 0;
    color: var(--ssg-text-soft);
    line-height: 1.75;
  }

  .ssg-sponsor-layout {
    display: grid;
    gap: 16px;
    margin-top: 16px;
  }

  .ssg-sponsor-layout.has-methods {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.3fr);
  }

  .ssg-sponsor-primary {
    display: grid;
    align-content: start;
    gap: 10px;
    padding: 16px;
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.9));
    border: 1px solid rgba(226, 232, 240, 0.95);
  }

  .ssg-sponsor-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    min-height: 44px;
    padding: 0 18px;
    border-radius: 999px;
    background: var(--ssg-text);
    color: white;
    text-decoration: none;
    font-weight: 600;
    box-shadow: 0 14px 26px rgba(15, 23, 42, 0.16);
  }

  .ssg-sponsor-button:hover {
    text-decoration: none;
    transform: translateY(-1px);
  }

  .ssg-sponsor-note {
    margin: 0;
    color: var(--ssg-text-muted);
    line-height: 1.7;
  }

  .ssg-sponsor-methods {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  }

  .ssg-sponsor-method {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 16px;
    border-radius: 18px;
    border: 1px solid rgba(226, 232, 240, 0.95);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
    text-decoration: none;
    text-align: center;
    color: inherit;
  }

  .ssg-sponsor-method:hover {
    text-decoration: none;
    border-color: rgba(148, 163, 184, 0.5);
    box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
    transform: translateY(-2px);
  }

  .ssg-sponsor-method-image-shell {
    width: 100%;
    max-width: 152px;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: 16px;
    background: white;
    border: 1px solid rgba(226, 232, 240, 0.95);
  }

  .ssg-sponsor-method-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ssg-sponsor-method-title {
    margin: 0;
    color: var(--ssg-text);
    font-size: 1rem;
    line-height: 1.35;
  }

  .ssg-sponsor-method-account {
    margin: 0;
    color: var(--ssg-text-soft);
    font-size: 0.92rem;
    line-height: 1.65;
  }

  .ssg-sponsor-method-note {
    margin: 0;
    color: var(--ssg-text-muted);
    font-size: 0.84rem;
    line-height: 1.65;
  }

  .ssg-friends-grid {
    display: grid;
    gap: 18px;
    grid-template-columns: 1fr;
  }

  .ssg-friend-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px;
    border-radius: 20px;
    border: 1px solid var(--ssg-line);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
    text-decoration: none;
    color: inherit;
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.05);
  }

  .ssg-friend-card:hover {
    border-color: rgba(37, 99, 235, 0.22);
    box-shadow: 0 22px 36px rgba(15, 23, 42, 0.08);
    transform: translateY(-2px);
  }

  .ssg-friend-head {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .ssg-friend-avatar-shell {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(219, 234, 254, 0.76), rgba(239, 246, 255, 0.96));
    border: 1px solid rgba(191, 219, 254, 0.95);
    overflow: hidden;
    flex-shrink: 0;
  }

  .ssg-friend-avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ssg-friend-avatar-fallback {
    color: var(--ssg-accent);
    font-size: 1.35rem;
    font-weight: 700;
  }

  .ssg-friend-title {
    margin: 0;
    color: var(--ssg-text);
    font-size: 1.02rem;
    line-height: 1.35;
    font-weight: 700;
    letter-spacing: -0.02em;
    overflow-wrap: anywhere;
  }

  .ssg-friend-host {
    margin: 4px 0 0;
    color: var(--ssg-text-muted);
    font-size: 0.8rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .ssg-friend-description {
    margin: 0;
    color: var(--ssg-text-soft);
    line-height: 1.75;
    overflow-wrap: anywhere;
  }

  .ssg-friend-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .ssg-friend-tag {
    display: inline-flex;
    align-items: center;
    min-height: 1.5rem;
    padding: 0.18rem 0.58rem;
    border-radius: 999px;
    background: rgba(239, 246, 255, 0.95);
    color: var(--ssg-accent);
    font-size: 0.72rem;
    font-weight: 600;
  }

  .ssg-friend-details {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ssg-friend-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-top: auto;
    width: 100%;
    color: var(--ssg-accent);
    font-size: 0.84rem;
    font-weight: 600;
  }

  .ssg-friends-application {
    display: grid;
    gap: 18px;
    margin-top: 22px;
    padding: 24px;
    border-radius: 20px;
    border: 1px solid var(--ssg-line);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(248, 250, 252, 0.95));
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.05);
  }

  .ssg-friends-application-kicker {
    margin: 0 0 8px;
    color: var(--ssg-text-muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .ssg-friends-application-title {
    margin: 0;
    color: var(--ssg-text);
    font-size: 1.2rem;
    line-height: 1.35;
    letter-spacing: -0.02em;
  }

  .ssg-friends-application-description {
    margin: 10px 0 0;
    color: var(--ssg-text-soft);
    line-height: 1.8;
  }

  .ssg-friends-application-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
  }

  .ssg-friends-application-panel {
    padding: 16px 18px;
    border-radius: 18px;
    border: 1px solid rgba(226, 232, 240, 0.92);
    background: rgba(248, 250, 252, 0.82);
  }

  .ssg-friends-application-panel-title {
    margin: 0 0 12px;
    color: var(--ssg-text);
    font-size: 0.96rem;
    line-height: 1.4;
    font-weight: 700;
  }

  .ssg-friends-application-list {
    display: grid;
    gap: 8px;
    margin: 0;
    padding-left: 18px;
    color: var(--ssg-text-soft);
    line-height: 1.75;
  }

  .ssg-friends-application-list li::marker {
    color: var(--ssg-accent);
  }

  .ssg-friends-application-template {
    margin: 0;
    padding: 16px 18px;
    overflow-x: auto;
    border-radius: 18px;
    border: 1px solid rgba(191, 219, 254, 0.85);
    background: linear-gradient(180deg, rgba(239, 246, 255, 0.92), rgba(248, 250, 252, 0.98));
    color: rgb(30, 41, 59);
    font-size: 0.86rem;
    line-height: 1.75;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .ssg-friends-application-contact {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .ssg-friends-application-contact-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.5rem;
    padding: 0.55rem 1rem;
    border-radius: 999px;
    background: rgba(37, 99, 235, 0.1);
    color: var(--ssg-accent);
    font-size: 0.88rem;
    font-weight: 700;
    text-decoration: none;
  }

  .ssg-friends-application-contact-link:hover {
    background: rgba(37, 99, 235, 0.14);
    text-decoration: none;
  }

  .ssg-friends-application-contact-copy {
    margin: 0;
    color: var(--ssg-text-soft);
    line-height: 1.75;
  }

  .ssg-prose h1,
  .ssg-prose h2,
  .ssg-prose h3,
  .ssg-prose h4 {
    margin: 1.5em 0 0.6em;
    line-height: 1.25;
    letter-spacing: -0.03em;
  }

  .ssg-prose p,
  .ssg-prose ul,
  .ssg-prose ol,
  .ssg-prose pre,
  .ssg-prose blockquote {
    margin: 0 0 1.1em;
  }

  .ssg-prose pre {
    overflow-x: auto;
    padding: 16px;
    border-radius: 16px;
    background: #0f172a;
    color: #e2e8f0;
  }

  .ssg-prose code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.92em;
  }

  .ssg-prose :not(pre) > code {
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.14);
  }

  .ssg-chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .ssg-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 999px;
    background: var(--ssg-accent-soft);
    color: var(--ssg-accent);
    text-decoration: none;
    font-size: 0.92rem;
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  .ssg-chip-current {
    background: var(--ssg-accent);
    color: #fff;
    font-weight: 700;
  }

  .ssg-pagination {
    margin-top: 28px;
    display: flex;
    justify-content: center;
  }

  .ssg-pagination-shell {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .ssg-pagination-link,
  .ssg-pagination-current,
  .ssg-pagination-disabled,
  .ssg-pagination-ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 40px;
    padding: 0 14px;
    border-radius: 999px;
    font-size: 0.94rem;
    line-height: 1;
  }

  .ssg-pagination-link,
  .ssg-pagination-current,
  .ssg-pagination-disabled {
    border: 1px solid var(--ssg-line);
    background: var(--ssg-panel-muted);
  }

  .ssg-pagination-link {
    color: var(--ssg-text);
    text-decoration: none;
  }

  .ssg-pagination-link:hover {
    border-color: rgba(37, 99, 235, 0.28);
    color: var(--ssg-accent);
  }

  .ssg-pagination-current {
    background: var(--ssg-accent);
    border-color: var(--ssg-accent);
    color: #fff;
    font-weight: 700;
  }

  .ssg-pagination-disabled,
  .ssg-pagination-ellipsis {
    color: var(--ssg-text-muted);
  }

  .ssg-sidebar {
    display: grid;
    gap: 18px;
  }

  .ssg-sidebar-card {
    padding: 18px;
  }

  .ssg-sidebar-search {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(248, 250, 252, 0.95);
    border: 1px solid rgba(226, 232, 240, 0.92);
  }

  .ssg-sidebar-search-icon {
    color: var(--ssg-text-muted);
    font-size: 0.92rem;
    line-height: 1;
  }

  .ssg-sidebar-search-input {
    flex: 1;
    min-width: 0;
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--ssg-text-soft);
    font: inherit;
    outline: none;
  }

  .ssg-sidebar-search-input::placeholder {
    color: var(--ssg-text-muted);
  }

  .ssg-sidebar-title {
    margin: 0 0 12px;
    font-size: 0.98rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .ssg-sidebar-list {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ssg-sidebar-link,
  .ssg-footer-link {
    color: var(--ssg-text);
    text-decoration: none;
  }

  .ssg-sidebar-meta {
    display: block;
    margin-top: 4px;
  }

  .ssg-sidebar-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .ssg-sidebar-meta-pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(248, 250, 252, 0.95);
    border: 1px solid rgba(226, 232, 240, 0.92);
    color: var(--ssg-text-muted);
    text-decoration: none;
    font-size: 0.78rem;
    line-height: 1.4;
  }

  .ssg-sidebar-socials {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .ssg-sidebar-social {
    display: inline-flex;
    align-items: center;
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(219, 234, 254, 0.5);
    border: 1px solid rgba(191, 219, 254, 0.92);
    color: var(--ssg-accent);
    text-decoration: none;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .ssg-sidebar-social:hover,
  .ssg-sidebar-meta-pill:hover {
    text-decoration: none;
    border-color: rgba(147, 197, 253, 0.96);
  }

  .ssg-avatar {
    width: 72px;
    height: 72px;
    border-radius: 999px;
    object-fit: cover;
    display: block;
    margin-bottom: 14px;
    border: 1px solid rgba(148, 163, 184, 0.28);
  }

  .ssg-footer {
    margin: 0 auto 36px;
  }

  .ssg-footer-inner {
    padding: 20px 24px;
  }

  .ssg-footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
  }

  .ssg-footer-snippet {
    padding: 0 24px 20px;
  }

  .ssg-footer-snippet p {
    margin: 0;
  }

  .ssg-footer-snippet p + p {
    margin-top: 0.55rem;
  }

  .ssg-footer-snippet a {
    color: var(--ssg-accent);
    text-decoration: none;
  }

  .ssg-footer-snippet a:hover {
    text-decoration: underline;
  }

  .ssg-archive-year {
    margin: 28px 0 14px;
    font-size: 1.12rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .ssg-archive-preview {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 10px;
  }

  .ssg-archive-preview a {
    color: var(--ssg-text);
    text-decoration: none;
  }

  .ssg-archive-preview a:hover {
    color: var(--ssg-accent);
  }

  .ssg-empty {
    padding: 20px;
    border-radius: 18px;
    border: 1px dashed rgba(148, 163, 184, 0.42);
    color: var(--ssg-text-muted);
    background: rgba(248, 250, 252, 0.8);
  }

  .ssg-configured-copy {
    display: grid;
    gap: 16px;
  }

  .ssg-configured-copy p {
    margin: 0;
    color: var(--ssg-text-soft);
    line-height: 1.9;
  }

  .ssg-configured-context,
  .ssg-configured-cards {
    display: grid;
    gap: 16px;
  }

  .ssg-configured-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 16px;
  }

  .ssg-configured-timeline {
    position: relative;
    display: grid;
    gap: 18px;
  }

  .ssg-configured-timeline::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 88px;
    width: 2px;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(37, 99, 235, 0.18), rgba(148, 163, 184, 0.28));
  }

  .ssg-configured-item {
    display: block;
    min-width: 0;
    width: 100%;
    padding: 18px 20px;
    border-radius: 18px;
    text-decoration: none;
    border: 1px solid var(--ssg-line);
    overflow: hidden;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .ssg-configured-item:hover {
    transform: translateY(-2px);
    border-color: rgba(37, 99, 235, 0.26);
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.08);
  }

  .ssg-configured-context .ssg-configured-item {
    background: rgba(248, 250, 252, 0.82);
  }

  .ssg-configured-cards .ssg-configured-item {
    background: #fff;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.05);
  }

  .ssg-configured-grid .ssg-configured-item {
    min-height: 180px;
    background:
      radial-gradient(circle at top right, rgba(191, 219, 254, 0.34), transparent 36%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  }

  .ssg-configured-meta {
    margin: 0 0 6px;
    color: var(--ssg-accent);
    font-size: 0.78rem;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .ssg-configured-media {
    margin: -18px -20px 16px;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(226, 232, 240, 0.9), rgba(226, 232, 240, 0.55));
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  }

  .ssg-configured-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ssg-configured-title {
    margin: 0;
    color: var(--ssg-text);
    font-size: 1.08rem;
    line-height: 1.45;
    letter-spacing: -0.02em;
    overflow-wrap: anywhere;
  }

  .ssg-configured-description {
    margin: 10px 0 0;
    color: var(--ssg-text-soft);
    line-height: 1.75;
    overflow-wrap: anywhere;
  }

  .ssg-configured-timeline-item {
    position: relative;
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
    text-decoration: none;
    color: inherit;
  }

  .ssg-configured-timeline-stamp {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.1rem;
    padding: 0.35rem 0.8rem;
    border-radius: 999px;
    border: 1px solid rgba(37, 99, 235, 0.18);
    background: linear-gradient(180deg, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0.06));
    color: var(--ssg-accent);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    box-shadow: 0 10px 24px rgba(37, 99, 235, 0.08);
    overflow-wrap: anywhere;
  }

  .ssg-configured-timeline-card {
    position: relative;
    display: block;
    min-width: 0;
    padding: 18px 20px;
    border-radius: 18px;
    border: 1px solid var(--ssg-line);
    background:
      radial-gradient(circle at top right, rgba(191, 219, 254, 0.24), transparent 34%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92));
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.06);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .ssg-configured-timeline-card::before {
    content: "";
    position: absolute;
    top: 22px;
    left: -16px;
    width: 16px;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(37, 99, 235, 0.18), rgba(37, 99, 235, 0.52));
  }

  .ssg-configured-timeline-item:hover .ssg-configured-timeline-card {
    transform: translateY(-2px);
    border-color: rgba(37, 99, 235, 0.24);
    box-shadow: 0 22px 36px rgba(15, 23, 42, 0.08);
  }

  @media (max-width: 960px) {
    .ssg-header-inner,
    .ssg-footer-inner {
      flex-direction: column;
      align-items: flex-start;
    }

    .ssg-announcement {
      align-items: flex-start;
      flex-direction: column;
    }

    .ssg-layout,
    .ssg-layout.is-sidebar-left {
      grid-template-columns: minmax(0, 1fr);
    }

    .ssg-sidebar,
    .ssg-layout.is-sidebar-left .ssg-sidebar,
    .ssg-layout.is-sidebar-left .ssg-content {
      order: initial;
    }

    .ssg-configured-grid {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }

    .ssg-sponsor-layout.has-methods {
      grid-template-columns: 1fr;
    }

    .ssg-friends-grid {
      gap: 16px;
    }

    .ssg-friend-card {
      padding: 16px;
      gap: 12px;
    }

    .ssg-friend-avatar-shell {
      width: 48px;
      height: 48px;
      border-radius: 14px;
    }

    .ssg-friends-application {
      padding: 20px;
    }

    .ssg-friends-application-contact-link {
      width: 100%;
    }

    .ssg-configured-timeline::before {
      left: 20px;
    }

    .ssg-configured-timeline-item {
      grid-template-columns: 1fr;
      gap: 10px;
      padding-left: 40px;
    }

    .ssg-configured-timeline-stamp {
      justify-self: start;
    }

    .ssg-configured-timeline-card::before {
      top: 20px;
      left: -24px;
      width: 24px;
    }
  }

  @media (max-width: 640px) {
    .ssg-content {
      padding: 20px 16px;
    }

    .ssg-page-header {
      margin-bottom: 22px;
      padding-bottom: 18px;
    }

    .ssg-configured-item,
    .ssg-configured-timeline-card {
      padding: 15px 16px;
    }

    .ssg-configured-media {
      margin: -15px -16px 14px;
    }

    .ssg-configured-title {
      font-size: 1rem;
      line-height: 1.5;
    }

    .ssg-configured-description {
      margin-top: 8px;
      font-size: 0.94rem;
      line-height: 1.72;
    }

    .ssg-configured-meta {
      font-size: 0.74rem;
      line-height: 1.5;
    }

    .ssg-configured-timeline-item {
      padding-left: 34px;
    }

    .ssg-configured-timeline-stamp {
      max-width: 100%;
      white-space: normal;
      line-height: 1.45;
    }

    .ssg-configured-timeline-card::before {
      left: -18px;
      width: 18px;
    }
  }

  @media (min-width: 960px) {
    .ssg-configured-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .ssg-friends-grid {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .ssg-friends-application-grid {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
  }
</style>
`

function toTrimmedString(value) {
  return String(value || '').trim()
}

function normalizeTextValue(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtmlEntities(input) {
  return String(input || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
}

function stripHtmlTags(input) {
  return decodeHtmlEntities(
    String(input || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
}

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

function createExcerpt(text, maxLength = 180) {
  const normalized = normalizeTextValue(text)
  if (!normalized) {
    return ''
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength).trim()}...`
}

function normalizePositiveInteger(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function toSlugId(input) {
  const normalized = toTrimmedString(input)

  if (!normalized) {
    return ''
  }

  return normalized
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeArticleLookupId(input) {
  return toTrimmedString(input)
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.md$/i, '')
}

function normalizeSiteUrl(value) {
  const normalized = toTrimmedString(value)

  if (!normalized) {
    return ''
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized.replace(/\/+$/, '')
  }

  return `https://${normalized}`.replace(/\/+$/, '')
}

function resolveBasePath() {
  const rawBase = toTrimmedString(process.env.VITE_BASE_PATH)

  if (!rawBase || rawBase === '/') {
    return '/'
  }

  return rawBase.endsWith('/') ? rawBase : `${rawBase}/`
}

function withBasePath(basePath, value) {
  const normalizedValue = toTrimmedString(value)

  if (!normalizedValue) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(normalizedValue) || normalizedValue.startsWith('data:')) {
    return normalizedValue
  }

  const normalizedBase = basePath === '/' ? '/' : `/${basePath.replace(/^\/+|\/+$/g, '')}/`
  const normalizedPath = normalizedValue.replace(/^\.?\//, '').replace(/^\/+/, '')

  return `${normalizedBase}${normalizedPath}`.replace(/(?<!:)\/{2,}/g, '/')
}

function buildAbsoluteUrl(siteUrl, basePath, routePath) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl)

  if (!normalizedSiteUrl) {
    return ''
  }

  const normalizedRoutePath = routePath === '/' ? '' : String(routePath || '').replace(/^\/+/, '')
  const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/+$/, '')
  const pathWithBase = [normalizedBase, normalizedRoutePath]
    .filter(Boolean)
    .join('/')
    .replace(/^\/+/, '')

  return pathWithBase ? `${normalizedSiteUrl}/${pathWithBase}` : normalizedSiteUrl
}

function formatDateIso(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString()
}

function normalizeDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  return toTrimmedString(value)
}

function formatDateLabel(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '未知日期'
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function resolveArticleHref(article) {
  return getArticlePath(article)
}

function resolveCollectionHref(prefix, id) {
  if (prefix === 'category') {
    return getCategoryPath(id)
  }

  if (prefix === 'tag') {
    return getTagPath(id)
  }

  return getHomePath()
}

function resolveInternalHref(basePath, routePath) {
  const normalizedRoutePath = String(routePath || '').trim()

  if (!normalizedRoutePath || normalizedRoutePath === '/') {
    return withBasePath(basePath, '/')
  }

  return withBasePath(basePath, normalizedRoutePath.replace(/^\/+/, ''))
}

function resolveThemeCssFile(themeConfig = {}) {
  const presets = themeConfig.presets && typeof themeConfig.presets === 'object'
    ? themeConfig.presets
    : {}
  const currentPreset = toTrimmedString(themeConfig.current_preset)
  const activePreset = currentPreset && presets[currentPreset] && typeof presets[currentPreset] === 'object'
    ? presets[currentPreset]
    : null

  return normalizeThemeAssetPath(activePreset?.css_file || themeConfig.css_file || '')
}

async function loadTomlConfig(name) {
  const filePath = path.join(CONFIG_DIR, `${name}.toml`)
  const raw = await readFile(filePath, 'utf8')
  return parseToml(raw)
}

async function loadConfigs() {
  const [site, profile, theme, links, announcement, comment, sponsor] = await Promise.all([
    loadTomlConfig('site'),
    loadTomlConfig('profile'),
    loadTomlConfig('theme'),
    loadTomlConfig('links'),
    loadTomlConfig('announcement'),
    loadTomlConfig('comment'),
    loadTomlConfig('sponsor')
  ])

  return applyConfigEnvOverrides({
    site,
    profile,
    theme,
    links,
    announcement,
    comment,
    sponsor
  }, process.env)
}

async function collectMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nestedEntries = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectMarkdownFiles(absolutePath)
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      return [absolutePath]
    }

    return []
  }))

  return nestedEntries.flat().sort((left, right) => left.localeCompare(right, 'en'))
}

async function loadArticles() {
  const files = await collectMarkdownFiles(ARTICLES_DIR)

  const items = await Promise.all(files.map(async (filePath) => {
    const rawContent = await readFile(filePath, 'utf8')
    const relativePath = path.relative(ROOT_DIR, filePath).split(path.sep).join('/')
    const sourcePath = `/${relativePath}`
    const article = parseArticleDetail(rawContent, sourcePath)

    return {
      ...article,
      date: normalizeDateValue(article.date),
      createdAt: normalizeDateValue(article.createdAt),
      updatedAt: normalizeDateValue(article.updatedAt),
      author: article.author?.name || ''
    }
  }))

  return items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
}

function loadContentEntries() {
  const entries = Array.isArray(contentIndexData?.entries)
    ? contentIndexData.entries.slice()
    : []

  return entries.sort((left, right) => (
    new Date(right.createdAt || 0) - new Date(left.createdAt || 0)
    || String(left.title || '').localeCompare(String(right.title || ''), 'zh-CN')
  ))
}

function buildCollections(entries) {
  const categories = new Map()
  const tags = new Map()
  const archive = new Map()

  entries.forEach((entry) => {
    if (entry.category?.id) {
      const current = categories.get(entry.category.id) || {
        ...entry.category,
        articleCount: 0,
        articles: []
      }
      current.articleCount += 1
      current.articles.push(entry)
      categories.set(entry.category.id, current)
    }

    ;(Array.isArray(entry.tags) ? entry.tags : []).forEach((tag) => {
      const current = tags.get(tag.id) || {
        ...tag,
        articleCount: 0,
        articles: []
      }
      current.articleCount += 1
      current.articles.push(entry)
      tags.set(tag.id, current)
    })

    const year = new Date(entry.createdAt || 0).getFullYear()
    if (Number.isFinite(year) && year > 0) {
      const current = archive.get(year) || []
      current.push(entry)
      archive.set(year, current)
    }
  })

  const categoryList = Array.from(categories.values())
    .sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name, 'zh-CN'))

  const tagList = Array.from(tags.values())
    .sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name, 'zh-CN'))

  const archiveList = Array.from(archive.entries())
    .map(([year, items]) => ({
      year,
      count: items.length,
      articles: items.sort((a, b) => (
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        || String(a.title || '').localeCompare(String(b.title || ''), 'zh-CN')
      ))
    }))
    .sort((a, b) => b.year - a.year)

  return {
    categories: categoryList,
    tags: tagList,
    archive: archiveList
  }
}

function normalizeFriendLinks(friendLinks = []) {
  if (!Array.isArray(friendLinks)) {
    return []
  }

  return friendLinks
    .map((link, index) => {
      const name = toTrimmedString(link?.name)
      const url = normalizeProfileLinkUrl(link?.url)
      const description = toTrimmedString(link?.description)
      const avatarUrl = normalizeFriendLinkAssetPath(
        link?.avatar_url || link?.logo_url || link?.image_url || link?.icon_url || link?.avatar || link?.logo || link?.image
      )
      const location = toTrimmedString(link?.location)
      const note = toTrimmedString(link?.note)
      const weight = Number.parseInt(link?.weight, 10)
      const enabled = typeof link?.enabled === 'boolean' ? link.enabled : true
      const tags = Array.isArray(link?.tags || link?.badges)
        ? (link.tags || link.badges).map(tag => toTrimmedString(tag)).filter(Boolean)
        : []

      if (!enabled || !name || !url) {
        return null
      }

      return {
        id: `friend-link-${index}`,
        name,
        url,
        description,
        avatarUrl,
        location,
        note,
        weight: Number.isFinite(weight) ? weight : 0,
        tags
      }
    })
    .filter(Boolean)
    .sort((left, right) => (
      right.weight - left.weight
      || left.name.localeCompare(right.name, 'zh-CN')
    ))
}

function normalizeProfileLinkUrl(value) {
  const normalizedValue = toTrimmedString(value)

  if (!normalizedValue) {
    return ''
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(normalizedValue)) {
    return normalizedValue
  }

  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(normalizedValue)) {
    return ''
  }

  return `https://${normalizedValue}`
}

function normalizeFriendLinkAssetPath(value) {
  const normalizedValue = toTrimmedString(value)

  if (!normalizedValue) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(normalizedValue) || normalizedValue.startsWith('data:')) {
    return normalizedValue
  }

  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(normalizedValue)) {
    return ''
  }

  return normalizedValue.replace(/^\.?\//, '')
}

function normalizeSocialLinks(links = []) {
  if (!Array.isArray(links)) {
    return []
  }

  return links
    .map((link, index) => {
      const name = toTrimmedString(link?.name || link?.label || link?.title)
      const url = normalizeProfileLinkUrl(link?.url || link?.href)

      if (!name || !url) {
        return null
      }

      return {
        id: toTrimmedString(link?.id) || `social-link-${index}`,
        name,
        url
      }
    })
    .filter(Boolean)
}

function normalizeAnnouncementLink(value) {
  const normalizedValue = toTrimmedString(value)

  if (!normalizedValue) {
    return {
      url: '',
      external: false
    }
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(normalizedValue)) {
    return {
      url: normalizedValue,
      external: true
    }
  }

  if (!normalizedValue.startsWith('/') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(normalizedValue)) {
    return {
      url: '',
      external: false
    }
  }

  return {
    url: normalizedValue,
    external: false
  }
}

function normalizeAnnouncementConfig(config = {}) {
  const title = toTrimmedString(config?.title)
  const content = toTrimmedString(config?.content)
  const linkText = toTrimmedString(config?.link_text)
  const link = normalizeAnnouncementLink(config?.link_url)
  const variant = ['success', 'warning'].includes(toTrimmedString(config?.variant).toLowerCase())
    ? toTrimmedString(config?.variant).toLowerCase()
    : 'info'

  return {
    enabled: config?.enabled === true && Boolean(title || content),
    title,
    content,
    linkText,
    linkUrl: link.url,
    external: link.external,
    dismissible: config?.dismissible !== false,
    variant
  }
}

function normalizeCommentProvider(value) {
  const normalizedValue = toTrimmedString(value).toLowerCase()

  return normalizedValue === 'utterances' || normalizedValue === 'giscus'
    ? normalizedValue
    : 'giscus'
}

function normalizeGiscusMapping(value) {
  const normalizedValue = toTrimmedString(value).toLowerCase()

  if (normalizedValue === 'og:title') {
    return 'og:title'
  }

  return GISCUS_MAPPING_VALUES.has(normalizedValue)
    ? normalizedValue
    : 'pathname'
}

function normalizeGiscusInputPosition(value) {
  const normalizedValue = toTrimmedString(value).toLowerCase()

  return GISCUS_INPUT_POSITION_VALUES.has(normalizedValue)
    ? normalizedValue
    : 'top'
}

function normalizeGiscusLoading(value) {
  const normalizedValue = toTrimmedString(value).toLowerCase()

  return GISCUS_LOADING_VALUES.has(normalizedValue)
    ? normalizedValue
    : 'lazy'
}

function normalizeUtterancesCrossorigin(value) {
  const normalizedValue = toTrimmedString(value).toLowerCase()

  return normalizedValue === 'use-credentials'
    ? 'use-credentials'
    : 'anonymous'
}

function normalizeCommentConfig(config = {}) {
  const provider = normalizeCommentProvider(config?.provider)
  const giscus = typeof config?.giscus === 'object' && config.giscus
    ? config.giscus
    : {}
  const utterances = typeof config?.utterances === 'object' && config.utterances
    ? config.utterances
    : {}
  const mapping = normalizeGiscusMapping(giscus.mapping)
  const term = toTrimmedString(giscus.term)
  const giscusReady = Boolean(
    toTrimmedString(giscus.repo)
    && toTrimmedString(giscus.repo_id || giscus.repoId)
    && toTrimmedString(giscus.category)
    && toTrimmedString(giscus.category_id || giscus.categoryId)
    && (mapping !== 'specific' || term)
  )
  const utterancesReady = Boolean(
    toTrimmedString(utterances.repo)
    && (
      toTrimmedString(utterances.issue_number || utterances.issueNumber)
      || toTrimmedString(utterances.issue_term || utterances.issueTerm)
    )
  )
  const ready = provider === 'utterances' ? utterancesReady : giscusReady

  return {
    enabled: config?.enabled === true,
    provider,
    title: toTrimmedString(config?.title) || '评论',
    description: toTrimmedString(config?.description),
    notReadyText: toTrimmedString(config?.not_ready_text || config?.notReadyText) || '评论系统尚未完成配置。',
    ready: config?.enabled === true && ready,
    giscus: {
      repo: toTrimmedString(giscus.repo),
      repoId: toTrimmedString(giscus.repo_id || giscus.repoId),
      category: toTrimmedString(giscus.category),
      categoryId: toTrimmedString(giscus.category_id || giscus.categoryId),
      mapping,
      term,
      strict: typeof giscus.strict === 'boolean' ? giscus.strict : false,
      reactionsEnabled: typeof giscus.reactions_enabled === 'boolean'
        ? giscus.reactions_enabled
        : typeof giscus.reactionsEnabled === 'boolean'
          ? giscus.reactionsEnabled
          : true,
      emitMetadata: typeof giscus.emit_metadata === 'boolean'
        ? giscus.emit_metadata
        : typeof giscus.emitMetadata === 'boolean'
          ? giscus.emitMetadata
          : false,
      inputPosition: normalizeGiscusInputPosition(giscus.input_position || giscus.inputPosition),
      lang: toTrimmedString(giscus.lang) || 'zh-CN',
      loading: normalizeGiscusLoading(giscus.loading),
      theme: toTrimmedString(giscus.theme) || 'light',
      darkTheme: toTrimmedString(giscus.dark_theme || giscus.darkTheme) || 'dark_dimmed'
    },
    utterances: {
      repo: toTrimmedString(utterances.repo),
      issueTerm: toTrimmedString(utterances.issue_term || utterances.issueTerm) || 'pathname',
      issueNumber: toTrimmedString(utterances.issue_number || utterances.issueNumber),
      label: toTrimmedString(utterances.label),
      theme: toTrimmedString(utterances.theme) || 'github-light',
      darkTheme: toTrimmedString(utterances.dark_theme || utterances.darkTheme) || 'github-dark',
      crossorigin: normalizeUtterancesCrossorigin(utterances.crossorigin)
    }
  }
}

function normalizeSponsorMethods(methods = []) {
  if (!Array.isArray(methods)) {
    return []
  }

  return methods
    .map((method, index) => {
      const name = toTrimmedString(method?.name || method?.label || method?.title)
      const accountName = toTrimmedString(method?.account_name || method?.accountName || method?.account || method?.payee)
      const note = toTrimmedString(method?.note || method?.description)
      const imageUrl = normalizeFriendLinkAssetPath(
        method?.image_url
        || method?.imageUrl
        || method?.qr_code_url
        || method?.qrCodeUrl
        || method?.qr_url
        || method?.qrUrl
        || method?.image
        || method?.qr_code
        || method?.qrCode
        || method?.qr
      )
      const link = normalizeAnnouncementLink(method?.link_url || method?.linkUrl || method?.url || method?.href)
      const enabled = typeof method?.enabled === 'boolean' ? method.enabled : true
      const weight = Number.parseInt(method?.weight, 10)

      if (!enabled || (!name && !accountName && !note && !imageUrl && !link.url)) {
        return null
      }

      return {
        id: toTrimmedString(method?.id) || `sponsor-method-${index}`,
        name: name || accountName || `赞助方式 ${index + 1}`,
        accountName,
        note,
        imageUrl,
        linkUrl: link.url,
        external: link.external,
        weight: Number.isFinite(weight) ? weight : 0
      }
    })
    .filter(Boolean)
    .sort((left, right) => (
      right.weight - left.weight
      || left.name.localeCompare(right.name, 'zh-CN')
    ))
}

function normalizeSponsorConfig(config = {}) {
  const buttonLink = normalizeAnnouncementLink(config?.button_url || config?.buttonUrl)
  const methods = normalizeSponsorMethods(config?.methods)
  const description = toTrimmedString(config?.description)

  return {
    enabled: config?.enabled === true && Boolean(buttonLink.url || methods.length > 0),
    title: toTrimmedString(config?.title) || '支持作者',
    description,
    buttonText: toTrimmedString(config?.button_text || config?.buttonText) || '前往支持',
    buttonUrl: buttonLink.url,
    buttonExternal: buttonLink.external,
    buttonNote: toTrimmedString(config?.button_note || config?.buttonNote),
    methods
  }
}

function normalizeLicenseRecord(license) {
  if (!license || typeof license !== 'object') {
    return null
  }

  const name = toTrimmedString(license.name)
  const url = normalizeAnnouncementLink(license.url).url

  if (!name && !url) {
    return null
  }

  return {
    name: name || url,
    url
  }
}

function shouldShowUpdatedAt(updatedAt, createdAt) {
  const updatedDate = new Date(updatedAt)
  const createdDate = new Date(createdAt)

  if (Number.isNaN(updatedDate.getTime())) {
    return false
  }

  if (!Number.isNaN(createdDate.getTime()) && updatedDate.getTime() === createdDate.getTime()) {
    return false
  }

  return true
}

function resolveProfileAvatar(basePath, value) {
  const normalized = toTrimmedString(value)

  if (!normalized) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:')) {
    return normalized
  }

  return withBasePath(basePath, normalized)
}

function renderMetaParts(parts) {
  const items = parts.filter(Boolean)

  if (items.length === 0) {
    return ''
  }

  return `<div class="ssg-meta">${items.join('')}</div>`
}

function renderCollectionShell(items, renderItem, variant = 'list', emptyText = '这里还没有内容。') {
  if (!Array.isArray(items) || items.length === 0) {
    return `<div class="ssg-empty">${escapeHtml(emptyText)}</div>`
  }

  if (variant === 'grid') {
    return `<div class="ssg-configured-grid">${items.map(item => renderItem(item, 'ssg-configured-item')).join('')}</div>`
  }

  if (variant === 'card') {
    return `<div class="ssg-configured-cards">${items.map(item => renderItem(item, 'ssg-configured-item')).join('')}</div>`
  }

  return `<div class="ssg-list">${items.map(item => renderItem(item, 'ssg-card')).join('')}</div>`
}

function resolveBuiltInPageVariant(pageKey, page, fallback = 'list') {
  const componentKey = resolveBuiltInPageComponentKey(pageKey, page?.component)

  if (componentKey === 'context') {
    return fallback
  }

  return componentKey || fallback
}

function resolveMenuPageVariant(page) {
  return resolveMenuPageComponentKey(page?.component)
}

function renderArticleCard(article, basePath, className = 'ssg-card') {
  const categoryLink = article.category
    ? `<a class="ssg-category" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('category', article.category.id)))}">${escapeHtml(article.category.name)}</a>`
    : ''
  const tags = article.tags.length > 0
    ? article.tags
      .slice(0, 3)
      .map(tag => `<a class="ssg-tag" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('tag', tag.id)))}">#${escapeHtml(tag.name)}</a>`)
      .join(' ')
    : ''

  return `
    <article class="${className}">
      <a class="ssg-article-link" href="${escapeAttribute(resolveInternalHref(basePath, resolveArticleHref(article)))}">${escapeHtml(article.title)}</a>
      ${renderMetaParts([
        `<span>${escapeHtml(formatDateLabel(article.createdAt || article.date))}</span>`,
        categoryLink,
        tags ? `<span>${tags}</span>` : ''
      ])}
      <p class="ssg-summary">${escapeHtml(article.excerpt)}</p>
    </article>
  `
}

function renderArticleList(articles, basePath, variant = 'list') {
  return renderCollectionShell(
    articles,
    (article, className) => renderArticleCard(article, basePath, className),
    variant,
    '这里还没有内容。'
  )
}

function paginateItems(items, pageSize = 10) {
  const normalizedItems = Array.isArray(items) ? items : []
  const resolvedPageSize = normalizePositiveInteger(pageSize, 10)
  const totalPages = Math.max(1, Math.ceil(normalizedItems.length / resolvedPageSize))

  return Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1
    const start = index * resolvedPageSize
    const end = start + resolvedPageSize

    return {
      page,
      totalPages,
      items: normalizedItems.slice(start, end)
    }
  })
}

function getDisplayedPages(currentPage, totalPages) {
  const totalDisplayed = 5
  const pages = []

  if (totalPages <= totalDisplayed) {
    for (let page = 1; page <= totalPages; page += 1) {
      pages.push(page)
    }
    return pages
  }

  const leftSide = Math.floor(totalDisplayed / 2)
  const rightSide = totalDisplayed - leftSide - 1

  if (currentPage > leftSide + 1) {
    pages.push(1)
    pages.push('...')
  }

  let start = Math.max(1, currentPage - leftSide)
  let end = Math.min(totalPages, currentPage + rightSide)

  if (end - start + 1 < totalDisplayed - 2) {
    if (start === 1) {
      end = Math.min(totalDisplayed - 1, totalPages)
    } else {
      start = Math.max(1, end - totalDisplayed + 3)
    }
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (end < totalPages - 1) {
    pages.push('...')
  }

  if (end < totalPages) {
    pages.push(totalPages)
  }

  return pages
}

function renderPagination({ currentPage, totalPages, resolvePagePath, basePath }) {
  if (!Number.isFinite(totalPages) || totalPages <= 1 || typeof resolvePagePath !== 'function') {
    return ''
  }

  const displayedPages = getDisplayedPages(currentPage, totalPages)
  const previousPage = currentPage > 1 ? currentPage - 1 : null
  const nextPage = currentPage < totalPages ? currentPage + 1 : null
  const previousLink = previousPage
    ? `<a class="ssg-pagination-link" href="${escapeAttribute(resolveInternalHref(basePath, resolvePagePath(previousPage)))}">上一页</a>`
    : '<span class="ssg-pagination-disabled">上一页</span>'
  const nextLink = nextPage
    ? `<a class="ssg-pagination-link" href="${escapeAttribute(resolveInternalHref(basePath, resolvePagePath(nextPage)))}">下一页</a>`
    : '<span class="ssg-pagination-disabled">下一页</span>'

  return `
    <nav class="ssg-pagination" aria-label="Pagination">
      <div class="ssg-pagination-shell">
        ${previousLink}
        ${displayedPages.map((page) => {
          if (page === '...') {
            return '<span class="ssg-pagination-ellipsis">···</span>'
          }

          if (page === currentPage) {
            return `<span class="ssg-pagination-current" aria-current="page">${page}</span>`
          }

          return `<a class="ssg-pagination-link" href="${escapeAttribute(resolveInternalHref(basePath, resolvePagePath(page)))}">${page}</a>`
        }).join('')}
        ${nextLink}
      </div>
    </nav>
  `
}

function renderPaginatedArticleList(items, options = {}) {
  const {
    currentPage = 1,
    totalPages = 1,
    resolvePagePath,
    basePath,
    variant = 'list'
  } = options

  return `
    ${renderMenuPage({
      component: variant,
      items: createStaticArticleCollectionItems(items),
      emptyText: '这里还没有内容。'
    }, basePath)}
    ${renderPagination({ currentPage, totalPages, resolvePagePath, basePath })}
  `
}

function renderPaginatedMenuPage(page, options = {}) {
  const {
    currentPage = 1,
    totalPages = 1,
    resolvePagePath,
    basePath
  } = options

  return `
    ${renderMenuPage(page, basePath)}
    ${renderPagination({ currentPage, totalPages, resolvePagePath, basePath })}
  `
}

function renderCategoryCard(category, basePath, className = 'ssg-card') {
  return `
    <article class="${className}">
      <a class="ssg-article-link" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('category', category.id)))}">${escapeHtml(category.name)}</a>
      <p class="ssg-summary">${escapeHtml(category.description || `共 ${category.articleCount} 篇文章`)}</p>
    </article>
  `
}

function renderCategoryList(categories, basePath, variant = 'list') {
  return renderCollectionShell(
    categories,
    (category, className) => renderCategoryCard(category, basePath, className),
    variant,
    '这里还没有分类。'
  )
}

function renderTagCard(tag, basePath, className = 'ssg-card') {
  return `
    <article class="${className}">
      <a class="ssg-article-link" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('tag', tag.id)))}">#${escapeHtml(tag.name)}</a>
      <p class="ssg-summary">${escapeHtml(`共 ${tag.articleCount} 篇文章`)}</p>
    </article>
  `
}

function renderTagList(tags, basePath, variant = 'list') {
  if (!Array.isArray(tags) || tags.length === 0) {
    return '<div class="ssg-empty">这里还没有标签。</div>'
  }

  if (variant !== 'list') {
    return renderCollectionShell(
      tags,
      (tag, className) => renderTagCard(tag, basePath, className),
      variant,
      '这里还没有标签。'
    )
  }

  return `
    <div class="ssg-chip-list">
      ${tags.map(tag => `
        <a class="ssg-chip" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('tag', tag.id)))}">
          <span>#${escapeHtml(tag.name)}</span>
          <span>${escapeHtml(String(tag.articleCount))}</span>
        </a>
      `).join('')}
    </div>
  `
}

function renderArchiveFilters(archiveGroups, basePath, activeYear = null) {
  if (!Array.isArray(archiveGroups) || archiveGroups.length === 0) {
    return ''
  }

  const allLink = activeYear
    ? `<a class="ssg-chip" href="${escapeAttribute(resolveInternalHref(basePath, getArchivePath()))}">全部</a>`
    : '<span class="ssg-chip ssg-chip-current" aria-current="page">全部</span>'

  return `
    <nav class="ssg-chip-list" aria-label="Archive years">
      ${allLink}
      ${archiveGroups.map((group) => {
        const year = Number(group?.year)
        if (!Number.isFinite(year)) {
          return ''
        }

        if (year === activeYear) {
          return `<span class="ssg-chip ssg-chip-current" aria-current="page">${escapeHtml(String(year))}</span>`
        }

        return `<a class="ssg-chip" href="${escapeAttribute(resolveInternalHref(basePath, getArchiveYearPath(year)))}">${escapeHtml(String(year))}</a>`
      }).join('')}
    </nav>
  `
}

function renderArchiveOverviewCard(group, basePath, className = 'ssg-card') {
  const year = Number(group?.year)
  const articleCount = Number(group?.count) || (Array.isArray(group?.articles) ? group.articles.length : 0)
  const previewArticles = Array.isArray(group?.articles) ? group.articles.slice(0, 3) : []

  return `
    <article class="${className}">
      <div class="ssg-meta">
        <span>${escapeHtml(String(year))} 年</span>
        <span>${escapeHtml(String(articleCount))} 篇文章</span>
      </div>
      <h2 class="ssg-archive-year">
        <a class="ssg-article-link" href="${escapeAttribute(resolveInternalHref(basePath, getArchiveYearPath(year)))}">${escapeHtml(`${year} 年归档`)}</a>
      </h2>
      ${previewArticles.length > 0
        ? `
          <ul class="ssg-archive-preview">
            ${previewArticles.map((article) => `
              <li>
                <a href="${escapeAttribute(resolveInternalHref(basePath, resolveArticleHref(article)))}">${escapeHtml(article.title)}</a>
              </li>
            `).join('')}
          </ul>
        `
        : '<div class="ssg-empty">该年份暂无文章。</div>'}
    </article>
  `
}

function renderArchiveOverview(archiveGroups, basePath, variant = 'card') {
  if (!Array.isArray(archiveGroups) || archiveGroups.length === 0) {
    return '<div class="ssg-empty">这里还没有归档内容。</div>'
  }

  return `
    ${renderArchiveFilters(archiveGroups, basePath)}
    ${renderCollectionShell(
      archiveGroups,
      (group, className) => renderArchiveOverviewCard(group, basePath, className),
      variant,
      '这里还没有归档内容。'
    )}
  `
}

function groupArchiveArticlesByMonth(articles) {
  if (!Array.isArray(articles) || articles.length === 0) {
    return []
  }

  const monthFormatter = new Intl.DateTimeFormat('zh-CN', { month: 'long' })
  const groups = new Map()

  articles.forEach((article) => {
    const date = new Date(article.createdAt || article.date)

    if (Number.isNaN(date.getTime())) {
      return
    }

    const monthNumber = date.getMonth() + 1
    const current = groups.get(monthNumber) || {
      month: monthFormatter.format(date),
      monthNumber,
      articles: []
    }

    current.articles.push(article)
    groups.set(monthNumber, current)
  })

  return Array.from(groups.values()).sort((a, b) => b.monthNumber - a.monthNumber)
}

function renderArchiveYearDetail(archiveGroup, archiveGroups, basePath, variant = 'list') {
  const year = Number(archiveGroup?.year)
  const monthGroups = groupArchiveArticlesByMonth(archiveGroup?.articles)

  return `
    ${renderArchiveFilters(archiveGroups, basePath, year)}
    ${monthGroups.length > 0
      ? monthGroups.map((group) => `
        <section>
          <h2 class="ssg-archive-year">${escapeHtml(group.month)}</h2>
          ${renderArticleList(group.articles, basePath, variant)}
        </section>
      `).join('')
      : '<div class="ssg-empty">该年份内还没有归档文章。</div>'}
  `
}

function renderCommentSection(commentConfig) {
  if (!commentConfig?.enabled) {
    return ''
  }

  const placeholderText = commentConfig.ready
    ? '评论区会在客户端通过 Giscus 加载。'
    : (commentConfig.notReadyText || '评论系统尚未完成配置。')

  return `
    <section class="ssg-comments-shell">
      <p class="ssg-comments-kicker">评论</p>
      <h2 class="ssg-comments-title">${escapeHtml(commentConfig.title || '评论')}</h2>
      ${commentConfig.description ? `<p class="ssg-comments-description">${escapeHtml(commentConfig.description)}</p>` : ''}
      <div class="ssg-empty">${escapeHtml(placeholderText)}</div>
    </section>
  `
}

function renderSponsorSection(sponsorConfig, basePath) {
  if (!sponsorConfig?.enabled) {
    return ''
  }

  const methods = Array.isArray(sponsorConfig.methods) ? sponsorConfig.methods : []
  const showPrimary = Boolean(sponsorConfig.buttonUrl || sponsorConfig.buttonNote)
  const layoutClass = methods.length > 0 ? ' has-methods' : ''
  const primaryButton = sponsorConfig.buttonUrl
    ? sponsorConfig.buttonExternal
      ? `<a class="ssg-sponsor-button" href="${escapeAttribute(sponsorConfig.buttonUrl)}" target="_blank" rel="noreferrer">${escapeHtml(sponsorConfig.buttonText || '前往支持')}</a>`
      : `<a class="ssg-sponsor-button" href="${escapeAttribute(resolveInternalHref(basePath, sponsorConfig.buttonUrl))}">${escapeHtml(sponsorConfig.buttonText || '前往支持')}</a>`
    : ''
  const primaryMarkup = showPrimary
    ? `
      <div class="ssg-sponsor-primary">
        ${primaryButton}
        ${sponsorConfig.buttonNote ? `<p class="ssg-sponsor-note">${escapeHtml(sponsorConfig.buttonNote)}</p>` : ''}
      </div>
    `
    : ''
  const methodsMarkup = methods.length > 0
    ? `
      <div class="ssg-sponsor-methods">
        ${methods.map((method) => {
          const tag = method.linkUrl ? 'a' : 'div'
          const href = method.linkUrl
            ? method.external
              ? ` href="${escapeAttribute(method.linkUrl)}" target="_blank" rel="noreferrer"`
              : ` href="${escapeAttribute(resolveInternalHref(basePath, method.linkUrl))}"`
            : ''
          const imageUrl = resolveStaticAssetUrl(basePath, method.imageUrl)

          return `
            <${tag} class="ssg-sponsor-method"${href}>
              ${imageUrl
                ? `
                  <div class="ssg-sponsor-method-image-shell">
                    <img class="ssg-sponsor-method-image" src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(`${method.name} 二维码`)}" />
                  </div>
                `
                : ''}
              <h3 class="ssg-sponsor-method-title">${escapeHtml(method.name)}</h3>
              ${method.accountName ? `<p class="ssg-sponsor-method-account">${escapeHtml(method.accountName)}</p>` : ''}
              ${method.note ? `<p class="ssg-sponsor-method-note">${escapeHtml(method.note)}</p>` : ''}
            </${tag}>
          `
        }).join('')}
      </div>
    `
    : ''

  return `
    <section class="ssg-sponsor-shell">
      <p class="ssg-sponsor-kicker">赞助</p>
      <h2 class="ssg-sponsor-title">${escapeHtml(sponsorConfig.title || '支持作者')}</h2>
      ${sponsorConfig.description ? `<p class="ssg-sponsor-description">${escapeHtml(sponsorConfig.description)}</p>` : ''}
      <div class="ssg-sponsor-layout${layoutClass}">
        ${primaryMarkup}
        ${methodsMarkup}
      </div>
    </section>
  `
}

function renderArticleDetail(article, relatedArticles, basePath, site = {}, commentConfig = {}, sponsorConfig = {}) {
  const cover = article.cover
    ? `<img class="ssg-cover" src="${escapeAttribute(article.cover)}" alt="${escapeAttribute(article.title)}" />`
    : ''
  const showUpdatedAt = shouldShowUpdatedAt(article.updatedAt, article.createdAt || article.date)
  const outdatedNotice = resolveOutdatedNotice(article, {
    showOutdatedNotice: site.features?.show_outdated_notice,
    outdatedThresholdDays: site.features?.outdated_threshold_days
  })
  const license = normalizeLicenseRecord(article.license)
  const meta = renderMetaParts([
    `<span>${escapeHtml(formatDateLabel(article.createdAt || article.date))}</span>`,
    showUpdatedAt ? `<span>更新于 ${escapeHtml(formatDateLabel(article.updatedAt))}</span>` : '',
    site.features?.show_read_time && article.readTime ? `<span>约 ${escapeHtml(String(article.readTime))} 分钟阅读</span>` : '',
    article.category
      ? `<a class="ssg-category" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('category', article.category.id)))}">${escapeHtml(article.category.name)}</a>`
      : '',
    article.author ? `<span>${escapeHtml(article.author)}</span>` : ''
  ])
  const tags = article.tags.length > 0
    ? `<div class="ssg-chip-list">${article.tags.map(tag => `
      <a class="ssg-chip" href="${escapeAttribute(resolveInternalHref(basePath, resolveCollectionHref('tag', tag.id)))}">#${escapeHtml(tag.name)}</a>
    `).join('')}</div>`
    : ''
  const related = Array.isArray(relatedArticles) && relatedArticles.length > 0
    ? `
      <section>
        <h2 class="ssg-archive-year">相关文章</h2>
        ${renderArticleList(relatedArticles, basePath)}
      </section>
    `
    : ''
  const licenseMarkup = license
    ? `
      <section class="ssg-license-card">
        <div class="ssg-license-label">许可协议</div>
        ${license.url
          ? `<a class="ssg-license-link" href="${escapeAttribute(license.url)}"${/^(https?:\/\/|mailto:|tel:)/i.test(license.url) ? ' target="_blank" rel="noreferrer"' : ''}>${escapeHtml(license.name)}</a>`
          : `<span class="ssg-license-link">${escapeHtml(license.name)}</span>`}
      </section>
    `
    : ''

  return `
    <article>
      <header class="ssg-page-header">
        <h1 class="ssg-page-title">${escapeHtml(article.title)}</h1>
        ${meta}
        ${article.excerpt ? `<p class="ssg-page-description">${escapeHtml(article.excerpt)}</p>` : ''}
      </header>
      ${cover}
      ${outdatedNotice
        ? `
          <section class="ssg-outdated-card">
            <div class="ssg-outdated-label">内容提醒</div>
            <p class="ssg-outdated-copy">
              这篇文章最后${outdatedNotice.referenceKind === 'updated' ? '更新' : '发布'}于 ${escapeHtml(formatDateLabel(outdatedNotice.referenceAt))}，距今已超过 ${escapeHtml(String(outdatedNotice.thresholdDays))} 天，部分内容可能已经过时，请结合当前版本或官方文档核实。
            </p>
          </section>
        `
        : ''}
      <div class="ssg-prose">${article.content}</div>
      ${tags ? `<section style="margin-top: 28px;">${tags}</section>` : ''}
      ${licenseMarkup}
      ${renderSponsorSection(sponsorConfig, basePath)}
      ${renderCommentSection(commentConfig)}
      ${related}
    </article>
  `
}

function resolveStaticAssetUrl(basePath, value) {
  const normalizedValue = toTrimmedString(value)

  if (!normalizedValue) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(normalizedValue) || normalizedValue.startsWith('data:')) {
    return normalizedValue
  }

  return withBasePath(basePath, normalizedValue.replace(/^\.?\//, ''))
}

function getHostnameLabel(value) {
  const normalizedValue = toTrimmedString(value)

  try {
    const url = new URL(normalizedValue)
    return url.hostname.replace(/^www\./i, '')
  } catch {
    return normalizedValue.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  }
}

function renderFriendLinksPage(friendLinks, basePath, emptyText = '还没有配置友情链接。') {
  if (!Array.isArray(friendLinks) || friendLinks.length === 0) {
    return `<div class="ssg-empty">${escapeHtml(emptyText)}</div>`
  }

  return `
    <div class="ssg-friends-grid">
      ${friendLinks.map((link) => {
        const avatarUrl = resolveStaticAssetUrl(basePath, link.avatarUrl)
        const details = [toTrimmedString(link.location), toTrimmedString(link.note)].filter(Boolean)
        const tags = Array.isArray(link.tags) ? link.tags : []

        return `
          <a class="ssg-friend-card" href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">
            <div class="ssg-friend-head">
              <div class="ssg-friend-avatar-shell">
                ${avatarUrl
                  ? `<img class="ssg-friend-avatar" src="${escapeAttribute(avatarUrl)}" alt="${escapeAttribute(`${link.name} logo`)}" />`
                  : `<span class="ssg-friend-avatar-fallback">${escapeHtml(String(link.name || '?').charAt(0).toUpperCase())}</span>`}
              </div>
              <div>
                <h2 class="ssg-friend-title">${escapeHtml(link.name)}</h2>
                <p class="ssg-friend-host">${escapeHtml(getHostnameLabel(link.url))}</p>
              </div>
            </div>
            ${link.description ? `<p class="ssg-friend-description">${escapeHtml(link.description)}</p>` : ''}
            ${tags.length > 0
              ? `<div class="ssg-friend-tags">${tags.map(tag => `<span class="ssg-friend-tag">${escapeHtml(tag)}</span>`).join('')}</div>`
              : ''}
            ${details.length > 0
              ? `<ul class="ssg-friend-details">${details.map(detail => `<li class="ssg-sidebar-meta">${escapeHtml(detail)}</li>`).join('')}</ul>`
              : ''}
            <span class="ssg-friend-action">访问站点</span>
          </a>
        `
      }).join('')}
    </div>
  `
}

function renderFriendApplicationSection(application = {}) {
  if (!application?.enabled) {
    return ''
  }

  const title = toTrimmedString(application.title) || '申请交换友链'
  const description = toTrimmedString(application.description)
  const requirements = Array.isArray(application.requirements)
    ? application.requirements.map(item => toTrimmedString(item)).filter(Boolean)
    : []
  const submissionFields = Array.isArray(application.submissionFields)
    ? application.submissionFields.map(item => toTrimmedString(item)).filter(Boolean)
    : []
  const template = toTrimmedString(application.template)
  const contactLabel = toTrimmedString(application.contactLabel)
  const contactUrl = toTrimmedString(application.contactUrl)

  return `
    <section class="ssg-friends-application">
      <div>
        <p class="ssg-friends-application-kicker">交换友链</p>
        <h2 class="ssg-friends-application-title">${escapeHtml(title)}</h2>
        ${description ? `<p class="ssg-friends-application-description">${escapeHtml(description)}</p>` : ''}
      </div>
      ${requirements.length > 0 || submissionFields.length > 0
        ? `
          <div class="ssg-friends-application-grid">
            ${requirements.length > 0
              ? `
                <div class="ssg-friends-application-panel">
                  <h3 class="ssg-friends-application-panel-title">申请条件</h3>
                  <ul class="ssg-friends-application-list">
                    ${requirements.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                  </ul>
                </div>
              `
              : ''}
            ${submissionFields.length > 0
              ? `
                <div class="ssg-friends-application-panel">
                  <h3 class="ssg-friends-application-panel-title">提交信息</h3>
                  <ul class="ssg-friends-application-list">
                    ${submissionFields.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                  </ul>
                </div>
              `
              : ''}
          </div>
        `
        : ''}
      ${template ? `<pre class="ssg-friends-application-template">${escapeHtml(template)}</pre>` : ''}
      ${contactUrl
        ? `
          <div class="ssg-friends-application-contact">
            <a class="ssg-friends-application-contact-link" href="${escapeAttribute(contactUrl)}"${/^(https?:\/\/|mailto:|tel:)/i.test(contactUrl) ? ' target="_blank" rel="noreferrer"' : ''}>
              ${escapeHtml(contactLabel || '联系我申请友链')}
            </a>
          </div>
        `
        : contactLabel
          ? `<div class="ssg-friends-application-contact"><p class="ssg-friends-application-contact-copy">${escapeHtml(contactLabel)}</p></div>`
          : ''}
    </section>
  `
}

function splitMenuPageContent(content = '') {
  return String(content || '')
    .trim()
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
}

function formatStaticDateLabel(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function pickStaticText(...values) {
  return values.map(value => String(value || '').trim()).find(Boolean) || ''
}

function createStaticArticleCollectionItems(items = []) {
  return (Array.isArray(items) ? items : []).map(article => {
    const categoryName = String(article?.category?.name || article?.category || '').trim()
    const dateLabel = formatStaticDateLabel(article?.createdAt || article?.date)

    return {
      key: `article-${String(article?.id || article?.slug || article?.title || '').trim()}`,
      kind: 'article',
      title: String(article?.title || '').trim(),
      description: pickStaticText(article?.summary, article?.description, article?.excerpt),
      meta: [dateLabel, categoryName].filter(Boolean).join(' · '),
      cover: article?.cover || '',
      to: getArticlePath(article)
    }
  })
}

function createStaticContentCollectionItems(items = []) {
  return (Array.isArray(items) ? items : []).map(item => {
    const title = String(item?.title || '').trim()
    const dateLabel = formatStaticDateLabel(item?.createdAt || item?.date)
    const sectionTitle = String(item?.sectionTitle || '').trim()
    const categoryName = String(item?.category?.name || item?.category || '').trim()

    return {
      key: String(item?.id || item?.to || item?.sourcePath || title).trim(),
      kind: String(item?.kind || 'entry').trim(),
      iconKind: String(item?.iconKind || item?.kind || 'entry').trim(),
      title,
      description: pickStaticText(item?.excerpt, item?.description),
      meta: [dateLabel, sectionTitle].filter(Boolean).join(' · '),
      footer: sectionTitle && sectionTitle !== title ? sectionTitle : '',
      cover: item?.cover || '',
      category: categoryName ? { label: categoryName } : null,
      tags: (Array.isArray(item?.tags) ? item.tags : [])
        .map(tag => ({ label: String(tag?.name || tag?.label || '').trim() }))
        .filter(tag => tag.label),
      to: String(item?.to || '').trim()
    }
  })
}

function createStaticCategoryCollectionItems(items = []) {
  return (Array.isArray(items) ? items : []).map(category => {
    const name = String(category?.name || '').trim()
    const count = Number(category?.count || category?.articleCount || 0)

    return {
      key: `category-${String(category?.id || name).trim()}`,
      kind: 'category',
      title: name,
      description: pickStaticText(category?.description, `查看 ${name} 分类下的全部内容`),
      meta: `${count} 项内容`,
      to: getCategoryPath(category)
    }
  })
}

function createStaticTagCollectionItems(items = []) {
  return (Array.isArray(items) ? items : []).map(tag => {
    const name = String(tag?.name || '').trim()
    const count = Number(tag?.count || tag?.articleCount || 0)

    return {
      key: `tag-${String(tag?.id || name).trim()}`,
      kind: 'tag',
      title: name,
      description: pickStaticText(tag?.description, `查看 ${name} 标签下的全部内容`),
      meta: `${count} 项内容`,
      to: getTagPath(tag)
    }
  })
}

function createStaticArchiveOverviewItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .map(group => {
      const year = Number(group?.year)
      const count = Number(group?.count) || (Array.isArray(group?.articles) ? group.articles.length : 0)

      if (!Number.isFinite(year)) {
        return null
      }

      return {
        key: `archive-${year}`,
        kind: 'archive',
        title: `${year} 年`,
        description: `${count} 项内容`,
        meta: '查看归档',
        to: getArchiveYearPath(year)
      }
    })
    .filter(Boolean)
}

async function loadStaticMenuPageSource(page, componentKey) {
  const normalizedComponentKey = resolveMenuPageComponentKey(componentKey)

  if (normalizedComponentKey === 'friends') {
    return {
      items: [],
      records: []
    }
  }

  if (normalizedComponentKey === 'context') {
    const relativeFilePath = normalizeMenuContentPath(page?.file, { kind: 'file' })

    if (!relativeFilePath) {
      return {
        title: '',
        description: '',
        content: '',
        contentHtml: ''
      }
    }

    const absoluteFilePath = path.join(ROOT_DIR, 'blog', 'content', relativeFilePath)

    try {
      const rawContent = await readFile(absoluteFilePath, 'utf8')
      return parseMenuContextSource(rawContent, path.posix.join('/blog/content', relativeFilePath))
    } catch {
      return {
        title: '',
        description: '',
        content: '',
        contentHtml: ''
      }
    }
  }

  const relativeFolderPath = normalizeMenuContentPath(page?.folder, { kind: 'folder' })

  if (!relativeFolderPath) {
    return {
      items: [],
      records: []
    }
  }

  const absoluteFolderPath = path.join(ROOT_DIR, 'blog', 'content', relativeFolderPath)

  try {
    const entries = await readdir(absoluteFolderPath, { withFileTypes: true })
    const fileEntries = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .sort((left, right) => left.name.localeCompare(right.name, 'en'))

    const items = await Promise.all(fileEntries.map(async (entry) => {
      const absoluteFilePath = path.join(absoluteFolderPath, entry.name)
      const sourcePath = path.posix.join('/blog/content', relativeFolderPath, entry.name)
      const rawContent = await readFile(absoluteFilePath, 'utf8')
      return parseMenuCollectionDetail(rawContent, sourcePath, { pagePath: page.path })
    }))
    const sortedItems = sortMenuCollectionItems(items)

    return {
      items: sortedItems.map(({
        order,
        date,
        content,
        contentHtml,
        plainText,
        detailDescription,
        sourcePath,
        ...item
      }) => item),
      records: sortedItems
    }
  } catch {
    return {
      items: [],
      records: []
    }
  }
}

function resolveMenuPageHref(item, basePath) {
  if (item?.external) {
    return escapeAttribute(item.href || '#')
  }

  return escapeAttribute(resolveInternalHref(basePath, item?.to || '/'))
}

function renderMenuPageItem(item, basePath, className = 'ssg-configured-item') {
  const tag = item?.to || item?.href ? 'a' : 'article'
  const href = tag === 'a' ? ` href="${resolveMenuPageHref(item, basePath)}"` : ''
  const target = item?.external ? ' target="_blank"' : ''
  const rel = item?.external ? ' rel="noreferrer"' : ''
  const cover = toTrimmedString(item?.cover || item?.imageUrl || item?.image)

  return `
    <${tag} class="${className}"${href}${target}${rel}>
      ${cover
        ? `<div class="ssg-configured-media"><img class="ssg-configured-image" src="${escapeAttribute(cover)}" alt="${escapeAttribute(item?.title || '')}" loading="lazy" /></div>`
        : ''}
      ${item?.meta ? `<p class="ssg-configured-meta">${escapeHtml(item.meta)}</p>` : ''}
      <h2 class="ssg-configured-title">${escapeHtml(item?.title || '')}</h2>
      ${item?.description ? `<p class="ssg-configured-description">${escapeHtml(item.description)}</p>` : ''}
    </${tag}>
  `
}

function isStaticArchiveMenuItem(item) {
  return String(item?.kind || '').trim().toLowerCase() === 'archive'
}

function resolveTimelineStamp(item) {
  if (isStaticArchiveMenuItem(item)) {
    const matchedYear = String(item?.title || '').match(/\d{4}/)
    return matchedYear?.[0] || String(item?.title || item?.description || '归档').trim()
  }

  const [primaryMeta] = String(item?.meta || '').split(' · ')
  return primaryMeta || String(item?.footer || '目录').trim()
}

function resolveTimelineMeta(item) {
  if (isStaticArchiveMenuItem(item)) {
    return String(item?.description || '').trim()
  }

  const [, ...restMetaParts] = String(item?.meta || '').split(' · ')
  return restMetaParts.join(' · ').trim()
}

function renderTimelineMenuPageItem(item, basePath) {
  const tag = item?.to || item?.href ? 'a' : 'article'
  const href = tag === 'a' ? ` href="${resolveMenuPageHref(item, basePath)}"` : ''
  const target = item?.external ? ' target="_blank"' : ''
  const rel = item?.external ? ' rel="noreferrer"' : ''
  const stamp = resolveTimelineStamp(item)
  const meta = resolveTimelineMeta(item)

  return `
    <${tag} class="ssg-configured-timeline-item"${href}${target}${rel}>
      <span class="ssg-configured-timeline-stamp">${escapeHtml(stamp)}</span>
      <div class="ssg-configured-timeline-card">
        ${meta ? `<p class="ssg-configured-meta">${escapeHtml(meta)}</p>` : ''}
        <h2 class="ssg-configured-title">${escapeHtml(item?.title || '')}</h2>
        ${item?.description ? `<p class="ssg-configured-description">${escapeHtml(item.description)}</p>` : ''}
      </div>
    </${tag}>
  `
}

function renderMenuPage(page, basePath) {
  const items = Array.isArray(page?.items) ? page.items : []
  const contentHtml = String(page?.contentHtml || '').trim()
  const contentBlocks = splitMenuPageContent(page?.content)
  const component = resolveMenuPageComponentKey(page?.component)

  if (component === 'context') {
    return `
      <div class="ssg-configured-context">
        ${contentHtml
          ? `<div class="ssg-configured-copy ssg-prose">${contentHtml}</div>`
          : ''}
        ${!contentHtml && contentBlocks.length > 0
          ? `<div class="ssg-configured-copy">${contentBlocks.map(block => `<p>${escapeHtml(block)}</p>`).join('')}</div>`
          : ''}
        ${items.length > 0
          ? items.map(item => renderMenuPageItem(item, basePath)).join('')
          : ''}
        ${!contentHtml && contentBlocks.length === 0 && items.length === 0 ? '<div class="ssg-empty">这个页面还没有配置内容。</div>' : ''}
      </div>
    `
  }

  if (component === 'timeline') {
    return items.length > 0
      ? `<div class="ssg-configured-timeline">${items.map(item => renderTimelineMenuPageItem(item, basePath)).join('')}</div>`
      : '<div class="ssg-empty">这个页面还没有配置时间线内容。</div>'
  }

  if (component === 'friends') {
    const introMarkup = contentHtml
      ? `<div class="ssg-configured-copy ssg-prose">${contentHtml}</div>`
      : contentBlocks.length > 0
        ? `<div class="ssg-configured-copy">${contentBlocks.map(block => `<p>${escapeHtml(block)}</p>`).join('')}</div>`
        : ''

    return `
      ${introMarkup}
      ${renderFriendLinksPage(page?.friendLinks, basePath, page?.emptyText || '还没有配置友情链接。')}
      ${renderFriendApplicationSection(page?.application)}
    `
  }

  if (component === 'grid') {
    return items.length > 0
      ? `<div class="ssg-configured-grid">${items.map(item => renderMenuPageItem(item, basePath)).join('')}</div>`
      : '<div class="ssg-empty">这个页面还没有配置网格内容。</div>'
  }

  if (component === 'list') {
    return items.length > 0
      ? `<div class="ssg-list">${items.map(item => renderMenuPageItem(item, basePath)).join('')}</div>`
      : '<div class="ssg-empty">这个页面还没有配置列表内容。</div>'
  }

  return items.length > 0
    ? `<div class="ssg-configured-cards">${items.map(item => renderMenuPageItem(item, basePath)).join('')}</div>`
    : '<div class="ssg-empty">这个页面还没有配置卡片内容。</div>'
}

function renderMenuPageDetail(page, item, basePath) {
  return `
    <header class="ssg-page-header">
      <p class="ssg-meta"><a class="ssg-inline-link" href="${escapeAttribute(resolveInternalHref(basePath, page?.path || '/'))}">${escapeHtml(page?.title || '')}</a></p>
      <h1 class="ssg-page-title">${escapeHtml(item?.title || '')}</h1>
      ${item?.meta ? `<p class="ssg-page-description">${escapeHtml(item.meta)}</p>` : ''}
      ${item?.description ? `<p class="ssg-page-description">${escapeHtml(item.description)}</p>` : ''}
    </header>
    ${item?.contentHtml
      ? `<div class="ssg-prose">${item.contentHtml}</div>`
      : '<div class="ssg-empty">这个条目还没有正文内容。</div>'}
  `
}

function resolveStaticMenuHref(basePath, item = {}) {
  if (item.external) {
    return escapeAttribute(item.href || '#')
  }

  return escapeAttribute(resolveInternalHref(basePath, item.to || '/'))
}

function renderStaticHeaderMenuGroup(group, basePath) {
  const items = Array.isArray(group?.rendererProps?.items) ? group.rendererProps.items : []

  return items.map((item) => {
    const rel = item.external ? ' rel="noreferrer"' : ''
    const target = item.external ? ' target="_blank"' : ''

    return `<a href="${resolveStaticMenuHref(basePath, item)}"${target}${rel}>${escapeHtml(item.label)}</a>`
  }).join('')
}

function renderStaticSidebarSection(section, basePath) {
  const items = Array.isArray(section?.rendererProps?.items) ? section.rendererProps.items : []
  const variant = section?.rendererProps?.variant || 'default'

  if (items.length === 0) {
    return ''
  }

  if (section.renderer === 'sidebar-article') {
    return `
      <section class="ssg-sidebar-card">
        <h2 class="ssg-sidebar-title">${escapeHtml(section.title || '')}</h2>
        <ul class="ssg-sidebar-list">
          ${items.map(item => `
            <li>
              <a class="ssg-sidebar-link" href="${resolveStaticMenuHref(basePath, item)}"${item.external ? ' target="_blank" rel="noreferrer"' : ''}>${escapeHtml(item.label)}</a>
              ${item.meta ? `<span class="ssg-sidebar-meta">${escapeHtml(item.meta)}</span>` : ''}
            </li>
          `).join('')}
        </ul>
      </section>
    `
  }

  if (variant === 'tags') {
    return `
      <section class="ssg-sidebar-card">
        <h2 class="ssg-sidebar-title">${escapeHtml(section.title || '')}</h2>
        <div class="ssg-chip-list">
          ${items.map(item => `
            <a class="ssg-chip" href="${resolveStaticMenuHref(basePath, item)}"${item.external ? ' target="_blank" rel="noreferrer"' : ''}>
              <span>${escapeHtml(item.label)}</span>
              ${item.badge ? `<span>${escapeHtml(item.badge)}</span>` : ''}
            </a>
          `).join('')}
        </div>
      </section>
    `
  }

  return `
    <section class="ssg-sidebar-card">
      <h2 class="ssg-sidebar-title">${escapeHtml(section.title || '')}</h2>
      <ul class="ssg-sidebar-list">
        ${items.map(item => `
          <li>
            <a class="ssg-sidebar-link" href="${resolveStaticMenuHref(basePath, item)}"${item.external ? ' target="_blank" rel="noreferrer"' : ''}>${escapeHtml(item.label)}</a>
            ${item.badge ? `<span class="ssg-sidebar-meta">${escapeHtml(item.badge)}</span>` : ''}
          </li>
        `).join('')}
      </ul>
    </section>
  `
}

function renderSidebar(data) {
  const {
    site,
    profile,
    latestArticles,
    categories,
    tags,
    friendLinks,
    basePath,
    menus,
    routePatterns,
    sidebarLayout,
    isArticlePage
  } = data
  const activeSidebarSections = resolveSidebarSections(sidebarLayout, {
    article: isArticlePage === true
  })
  const displayName = toTrimmedString(profile.display_name) || toTrimmedString(profile.username) || toTrimmedString(site.title)
  const displayUsername = toTrimmedString(profile.username).replace(/^@+/, '')
  const tagline = toTrimmedString(profile.tagline) || toTrimmedString(site.description)
  const bio = toTrimmedString(profile.bio)
  const location = toTrimmedString(profile.location)
  const website = normalizeProfileLinkUrl(profile.website)
  const socialLinks = normalizeSocialLinks(profile.social_links)
  const avatar = resolveProfileAvatar(basePath, profile.avatar_url)
  const profileMeta = [
    location ? `<span class="ssg-sidebar-meta-pill">${escapeHtml(location)}</span>` : '',
    website ? `<a class="ssg-sidebar-meta-pill" href="${escapeAttribute(website)}" target="_blank" rel="noreferrer">${escapeHtml(website.replace(/^https?:\/\//i, '').replace(/\/+$/, ''))}</a>` : ''
  ].filter(Boolean).join('')
  const socialMarkup = socialLinks.length > 0
    ? `
      <div class="ssg-sidebar-socials">
        ${socialLinks.map(link => `
          <a class="ssg-sidebar-social" href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.name)}</a>
        `).join('')}
      </div>
    `
    : ''
  const profileCard = site.features?.show_profile_in_sidebar !== false && (displayName || tagline || avatar || bio || profileMeta || socialMarkup)
    ? `
      <section class="ssg-sidebar-card">
        ${avatar ? `<img class="ssg-avatar" src="${escapeAttribute(avatar)}" alt="${escapeAttribute(displayName || 'avatar')}" />` : ''}
        ${displayName ? `<h2 class="ssg-sidebar-title">${escapeHtml(displayName)}</h2>` : ''}
        ${displayUsername ? `<div class="ssg-sidebar-meta">@${escapeHtml(displayUsername)}</div>` : ''}
        ${tagline ? `<p class="ssg-sidebar-copy">${escapeHtml(tagline)}</p>` : ''}
        ${bio ? `<p class="ssg-sidebar-copy">${escapeHtml(bio)}</p>` : ''}
        ${profileMeta ? `<div class="ssg-sidebar-meta-row">${profileMeta}</div>` : ''}
        ${socialMarkup}
      </section>
    `
    : ''
  const menuSections = resolveSidebarMenuSections(menus, {
    routePatterns,
    categories,
    tags,
    latestArticles,
    friendLinks,
    showCategoryCount: site.features?.show_category_count,
    showTagCount: site.features?.show_tag_count,
    formatArticleMeta: (article) => formatDateLabel(article.createdAt || article.date)
  })
  const menuMarkup = menuSections.length > 0
    ? menuSections.map(section => renderStaticSidebarSection(section, basePath)).join('')
    : `
      <section class="ssg-sidebar-card">
        <p class="ssg-empty">暂无侧边栏内容</p>
      </section>
    `

  return activeSidebarSections.map((sectionKey) => {
    if (sectionKey === 'profile') {
      return profileCard
    }

    if (sectionKey === 'search') {
      return `
        <section class="ssg-sidebar-card">
          <div class="ssg-sidebar-search" role="search" aria-label="站内搜索">
            <span class="ssg-sidebar-search-icon" aria-hidden="true">⌕</span>
            <input class="ssg-sidebar-search-input" type="text" placeholder="搜索文章..." disabled />
          </div>
        </section>
      `
    }

    if (sectionKey === 'menu') {
      return menuMarkup
    }

    return ''
  }).filter(Boolean).join('')
}

function renderFooter(site, friendLinks) {
  const footerText = toTrimmedString(site.footer?.text || site.footer_text)
  const footerNote = toTrimmedString(site.footer?.note || site.footer_note)
  const footerSnippetHtml = toTrimmedString(
    site.footer?.snippetHtml
    || site.footer?.snippet_html
    || site.footer?.html
    || site.footer_snippet_html
    || site.footer_html
  )
  const linksMarkup = friendLinks.length > 0
    ? `
      <div class="ssg-footer-links">
        ${friendLinks.map(link => `
          <a class="ssg-footer-link" href="${escapeAttribute(link.url)}">${escapeHtml(link.name)}</a>
        `).join('')}
      </div>
    `
    : ''

  return `
    <footer class="ssg-footer ssg-container">
      <div class="ssg-footer-inner">
        <div>
          ${footerText ? `<div class="ssg-footer-copy">${escapeHtml(footerText)}</div>` : ''}
          ${footerNote ? `<div class="ssg-footer-note">${escapeHtml(footerNote)}</div>` : ''}
        </div>
        ${linksMarkup}
      </div>
      ${footerSnippetHtml ? `<div class="ssg-footer-snippet">${footerSnippetHtml}</div>` : ''}
    </footer>
  `
}

function renderAnnouncement(basePath, announcement) {
  if (!announcement?.enabled) {
    return ''
  }

  const badge = announcement.variant === 'success'
    ? '更新'
    : announcement.variant === 'warning'
      ? '提醒'
      : '公告'
  const linkMarkup = announcement.linkUrl && announcement.linkText
    ? announcement.external
      ? `<a class="ssg-announcement-link" href="${escapeAttribute(announcement.linkUrl)}" target="_blank" rel="noreferrer">${escapeHtml(announcement.linkText)}</a>`
      : `<a class="ssg-announcement-link" href="${escapeAttribute(resolveInternalHref(basePath, announcement.linkUrl))}">${escapeHtml(announcement.linkText)}</a>`
    : ''

  return `
    <section class="ssg-announcement" data-variant="${escapeAttribute(announcement.variant || 'info')}">
      <div class="ssg-announcement-copy">
        <span class="ssg-announcement-badge">${escapeHtml(badge)}</span>
        <div>
          ${announcement.title ? `<strong class="ssg-announcement-title">${escapeHtml(announcement.title)}</strong>` : ''}
          ${announcement.content ? `<p class="ssg-announcement-text">${escapeHtml(announcement.content)}</p>` : ''}
        </div>
      </div>
      ${linkMarkup}
    </section>
  `
}

function renderLayout({
  site,
  profile,
  announcement,
  content,
  latestArticles,
  categories,
  tags,
  friendLinks,
  menus,
  routePatterns,
  basePath,
  sidebarPosition,
  sidebarVisible,
  sidebarLayout,
  isArticlePage
}) {
  const brandTitle = toTrimmedString(site.title) || toTrimmedString(profile.display_name) || 'Blog'
  const brandDescription = toTrimmedString(site.description) || toTrimmedString(profile.tagline)
  const announcementMarkup = renderAnnouncement(basePath, announcement)
  const headerMenuGroups = resolveHeaderMenuGroups(menus, {
    routePatterns
  })
  const showSidebar = sidebarVisible && sidebarPosition !== 'hidden'

  return `
    <div class="ssg-shell">
      <header class="ssg-header">
        <div class="ssg-container ssg-header-inner">
          <a class="ssg-brand" href="${escapeAttribute(resolveInternalHref(basePath, getHomePath()))}">
            <span class="ssg-brand-title">${escapeHtml(brandTitle)}</span>
            ${brandDescription ? `<span class="ssg-brand-description">${escapeHtml(brandDescription)}</span>` : ''}
          </a>
          <nav class="ssg-nav">
            ${headerMenuGroups.map(group => renderStaticHeaderMenuGroup(group, basePath)).join('')}
          </nav>
        </div>
      </header>
      <main class="ssg-main">
        ${announcementMarkup}
        <div class="ssg-container ssg-layout ${showSidebar && sidebarPosition === 'left' ? 'is-sidebar-left' : ''}">
          <section class="ssg-content">
            ${content}
          </section>
          ${showSidebar ? `<aside class="ssg-sidebar">${renderSidebar({
            site,
            profile,
            latestArticles,
            categories,
            tags,
            friendLinks,
            menus,
            routePatterns,
            basePath,
            sidebarLayout,
            isArticlePage
          })}</aside>` : ''}
        </div>
      </main>
      ${renderFooter(site, friendLinks)}
    </div>
  `
}

function injectHead(template, {
  title,
  description,
  absoluteUrl,
  imageUrl,
  ogType,
  robots,
  themeCssHref,
  includeStaticPreview = false
}) {
  const headTags = [
    includeStaticPreview ? STATIC_STYLE : '',
    description ? `<meta name="description" content="${escapeAttribute(description)}" />` : '',
    `<meta property="og:title" content="${escapeAttribute(title)}" />`,
    description ? `<meta property="og:description" content="${escapeAttribute(description)}" />` : '',
    ogType ? `<meta property="og:type" content="${escapeAttribute(ogType)}" />` : '',
    absoluteUrl ? `<meta property="og:url" content="${escapeAttribute(absoluteUrl)}" />` : '',
    imageUrl ? `<meta property="og:image" content="${escapeAttribute(imageUrl)}" />` : '',
    `<meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${escapeAttribute(title)}" />`,
    description ? `<meta name="twitter:description" content="${escapeAttribute(description)}" />` : '',
    imageUrl ? `<meta name="twitter:image" content="${escapeAttribute(imageUrl)}" />` : '',
    absoluteUrl ? `<link rel="canonical" href="${escapeAttribute(absoluteUrl)}" />` : '',
    robots ? `<meta name="robots" content="${escapeAttribute(robots)}" />` : '',
    includeStaticPreview && themeCssHref
      ? `<link rel="stylesheet" href="${escapeAttribute(themeCssHref)}" id="vue-blog-static-theme" />`
      : ''
  ].filter(Boolean).join('\n    ')

  const nextTemplate = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  return nextTemplate.replace('</head>', `    ${headTags}\n  </head>`)
}

function replaceAppRoot(template, markup) {
  return template.replace('<div id="app"></div>', `<div id="app">${markup}</div>`)
}

async function writeRouteFile(routePath, html) {
  const normalized = routePath === '/' ? '' : decodeURIComponent(String(routePath).replace(/^\/+|\/+$/g, ''))
  const filePath = normalized
    ? path.join(DIST_DIR, normalized, 'index.html')
    : path.join(DIST_DIR, 'index.html')

  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, html, 'utf8')
}

function renderPage(route, context) {
  const {
    site,
    profile,
    categories,
    tags,
    archive,
    articles,
    latestArticles,
    friendLinks,
    menus,
    routePatterns,
    basePath,
    themeCssHref
  } = context
  const sidebarPosition = toTrimmedString(site.features?.sidebar_position || 'right').toLowerCase() || 'right'
  const sidebarVisible = sidebarPosition !== 'hidden' && site.features?.sidebar_visible !== false
  const sidebarLayout = normalizeSidebarLayout(site.sidebar)
  const siteTitle = toTrimmedString(site.title) || toTrimmedString(profile.display_name) || 'Blog'
  const pageTitle = route.pageTitle ? `${route.pageTitle} - ${siteTitle}` : siteTitle
  const description = route.description || toTrimmedString(site.description) || toTrimmedString(profile.tagline)
  const absoluteUrl = buildAbsoluteUrl(site.site_url || site.url, basePath, route.path)
  const imageUrl = route.imageUrl
    ? (/^(https?:)?\/\//i.test(route.imageUrl) ? route.imageUrl : buildAbsoluteUrl(site.site_url || site.url, basePath, route.imageUrl))
    : ''
  const includeStaticPreview = route.staticPreview !== false
  const content = includeStaticPreview
    ? renderLayout({
      site,
      profile,
      announcement: context.announcement,
      content: route.content,
      latestArticles,
      categories,
      tags,
      friendLinks,
      menus,
      routePatterns,
      basePath,
      sidebarPosition,
      sidebarVisible,
      sidebarLayout,
      isArticlePage: route.isArticlePage === true
    })
    : ''

  const withHead = injectHead(context.template, {
    title: pageTitle,
    description,
    absoluteUrl,
    imageUrl,
    ogType: route.ogType || 'website',
    robots: route.robots || '',
    themeCssHref,
    includeStaticPreview
  })

  return replaceAppRoot(withHead, content)
}

function getRelatedArticles(currentArticle, articles) {
  return articles
    .filter((article) => {
      if (article.id === currentArticle.id) {
        return false
      }

      const sameCategory = article.category && currentArticle.category && article.category.id === currentArticle.category.id
      const sharedTag = article.tags.some(tag => currentArticle.tags.some(currentTag => currentTag.id === tag.id))
      return sameCategory || sharedTag
    })
    .slice(0, 3)
}

async function createPageRoutes(context) {
  const { site, articles, categories, tags, archive, friendLinks, basePath, pageSize, routePatterns, menus } = context
  const articlePages = paginateItems(articles, pageSize)
  const homePage = resolveMenuPage('home', menus, routePatterns)
  const articlesPageConfig = resolveMenuPage('articles', menus, routePatterns)
  const categoriesPage = resolveMenuPage('categories', menus, routePatterns)
  const tagsPage = resolveMenuPage('tags', menus, routePatterns)
  const archivePage = resolveMenuPage('archive', menus, routePatterns)
  const homeComponent = resolveBuiltInPageVariant('home', homePage, 'list')
  const articlesComponent = resolveBuiltInPageVariant('articles', articlesPageConfig, 'card')
  const categoriesComponent = resolveBuiltInPageVariant('categories', categoriesPage, 'grid')
  const tagsComponent = resolveBuiltInPageVariant('tags', tagsPage, 'list')
  const archiveComponent = resolveBuiltInPageVariant('archive', archivePage, 'timeline')
  const homeCollectionPage = {
    component: homeComponent,
    items: createStaticArticleCollectionItems(articles.slice(0, 10)),
    emptyText: '这里还没有文章。'
  }
  const firstArticlesCollectionPage = {
    component: articlesComponent,
    items: createStaticArticleCollectionItems(articlePages[0]?.items || []),
    emptyText: '这里还没有文章。'
  }
  const categoriesCollectionPage = {
    component: categoriesComponent,
    items: createStaticCategoryCollectionItems(categories),
    emptyText: '目前还没有分类。'
  }
  const tagsCollectionPage = {
    component: tagsComponent,
    items: createStaticTagCollectionItems(tags),
    emptyText: '目前还没有标签。'
  }
  const archiveOverviewCollectionPage = {
    component: archiveComponent,
    items: createStaticArchiveOverviewItems(archive),
    emptyText: '这里还没有归档内容。'
  }

  const routes = [
    {
      path: getHomePath(),
      pageTitle: homePage?.title || '最新文章',
      description: homePage?.description || '浏览站点最新发布的文章内容。',
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(homePage?.title || '最新文章')}</h1>
          <p class="ssg-page-description">${escapeHtml(homePage?.description || '这里收录了站点最近发布的内容。')}</p>
        </header>
        ${renderMenuPage(homeCollectionPage, basePath)}
      `
    },
    {
      path: getArticlesPath(),
      pageTitle: articlesPageConfig?.title || '所有文章',
      description: articlesPageConfig?.description || '浏览站点全部文章列表。',
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(articlesPageConfig?.title || '所有文章')}</h1>
          <p class="ssg-page-description">按发布时间查看全部文章内容，共 ${escapeHtml(String(articles.length))} 篇。</p>
        </header>
        ${renderPaginatedMenuPage(firstArticlesCollectionPage, {
          currentPage: 1,
          totalPages: articlePages[0]?.totalPages || 1,
          resolvePagePath: (page) => getArticlesPagePath(page),
          basePath
        })}
      `
    },
    {
      path: getCategoriesPath(),
      pageTitle: categoriesPage?.title || '内容分类',
      description: categoriesPage?.description || '浏览站点所有内容分类。',
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(categoriesPage?.title || '内容分类')}</h1>
          <p class="ssg-page-description">${escapeHtml(categoriesPage?.description || '按分类整理全部站点内容。')}</p>
        </header>
        ${renderMenuPage(categoriesCollectionPage, basePath)}
      `
    },
    {
      path: getTagsPath(),
      pageTitle: tagsPage?.title || '内容标签',
      description: tagsPage?.description || '浏览站点所有内容标签。',
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(tagsPage?.title || '内容标签')}</h1>
          <p class="ssg-page-description">${escapeHtml(tagsPage?.description || '按标签快速浏览站点内容。')}</p>
        </header>
        ${renderMenuPage(tagsCollectionPage, basePath)}
      `
    },
    {
      path: getArchivePath(),
      pageTitle: archivePage?.title || '内容归档',
      description: archivePage?.description || '按年份浏览站点归档内容。',
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(archivePage?.title || '内容归档')}</h1>
          <p class="ssg-page-description">${escapeHtml(archivePage?.description || '按年份查看全部归档内容。')}</p>
        </header>
        ${renderMenuPage(archiveOverviewCollectionPage, basePath)}
      `
    },
    {
      path: getSearchPath(),
      pageTitle: '搜索',
      description: '搜索站点中的文章内容。',
      robots: 'noindex,follow',
      sitemap: false,
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">搜索</h1>
          <p class="ssg-page-description">搜索结果页由前端应用接管，这里保留静态入口和站点结构。</p>
        </header>
        <div class="ssg-empty">输入关键词后，页面会在客户端加载搜索结果。</div>
      `
    }
  ]

  articlePages.slice(1).forEach((pageGroup) => {
    const paginatedArticlesCollectionPage = {
      component: articlesComponent,
      items: createStaticArticleCollectionItems(pageGroup.items),
      emptyText: '这里还没有文章。'
    }

    routes.push({
      path: getArticlesPagePath(pageGroup.page),
      pageTitle: `${articlesPageConfig?.title || '所有文章'} - 第 ${pageGroup.page} 页`,
      description: `${articlesPageConfig?.description || '浏览站点全部文章列表。'} 第 ${pageGroup.page} 页。`,
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(articlesPageConfig?.title || '所有文章')}</h1>
          <p class="ssg-page-description">按发布时间查看全部文章内容，第 ${escapeHtml(String(pageGroup.page))} 页。</p>
        </header>
        ${renderPaginatedMenuPage(paginatedArticlesCollectionPage, {
          currentPage: pageGroup.page,
          totalPages: pageGroup.totalPages,
          resolvePagePath: (page) => getArticlesPagePath(page),
          basePath
        })}
      `
    })
  })

  categories.forEach((category) => {
    const categoryPages = paginateItems(category.articles, pageSize)
    const firstCategoryPage = {
      component: articlesComponent,
      items: createStaticContentCollectionItems(categoryPages[0]?.items || []),
      emptyText: '这个分类下还没有内容。'
    }

    routes.push({
      path: getCategoryPath(category),
      pageTitle: `分类：${category.name}`,
      description: `浏览分类 ${category.name} 下的内容。`,
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">分类：${escapeHtml(category.name)}</h1>
          <p class="ssg-page-description">共 ${escapeHtml(String(category.articleCount))} 项内容。</p>
        </header>
        ${renderPaginatedMenuPage(firstCategoryPage, {
          currentPage: 1,
          totalPages: categoryPages[0]?.totalPages || 1,
          resolvePagePath: (page) => getCategoryPagePath(category, page),
          basePath
        })}
      `
    })

    categoryPages.slice(1).forEach((pageGroup) => {
      const paginatedCategoryPage = {
        component: articlesComponent,
        items: createStaticContentCollectionItems(pageGroup.items),
        emptyText: '这个分类下还没有内容。'
      }

      routes.push({
        path: getCategoryPagePath(category, pageGroup.page),
        pageTitle: `分类：${category.name} - 第 ${pageGroup.page} 页`,
        description: `浏览分类 ${category.name} 下的内容，第 ${pageGroup.page} 页。`,
        content: `
          <header class="ssg-page-header">
            <h1 class="ssg-page-title">分类：${escapeHtml(category.name)}</h1>
            <p class="ssg-page-description">共 ${escapeHtml(String(category.articleCount))} 项内容，第 ${escapeHtml(String(pageGroup.page))} 页。</p>
          </header>
          ${renderPaginatedMenuPage(paginatedCategoryPage, {
            currentPage: pageGroup.page,
            totalPages: pageGroup.totalPages,
            resolvePagePath: (page) => getCategoryPagePath(category, page),
            basePath
          })}
        `
      })
    })
  })

  tags.forEach((tag) => {
    const tagPages = paginateItems(tag.articles, pageSize)
    const firstTagPage = {
      component: articlesComponent,
      items: createStaticContentCollectionItems(tagPages[0]?.items || []),
      emptyText: '这个标签下还没有内容。'
    }

    routes.push({
      path: getTagPath(tag),
      pageTitle: `标签：${tag.name}`,
      description: `浏览标签 ${tag.name} 下的内容。`,
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">标签：#${escapeHtml(tag.name)}</h1>
          <p class="ssg-page-description">共 ${escapeHtml(String(tag.articleCount))} 项内容。</p>
        </header>
        ${renderPaginatedMenuPage(firstTagPage, {
          currentPage: 1,
          totalPages: tagPages[0]?.totalPages || 1,
          resolvePagePath: (page) => getTagPagePath(tag, page),
          basePath
        })}
      `
    })

    tagPages.slice(1).forEach((pageGroup) => {
      const paginatedTagPage = {
        component: articlesComponent,
        items: createStaticContentCollectionItems(pageGroup.items),
        emptyText: '这个标签下还没有内容。'
      }

      routes.push({
        path: getTagPagePath(tag, pageGroup.page),
        pageTitle: `标签：${tag.name} - 第 ${pageGroup.page} 页`,
        description: `浏览标签 ${tag.name} 下的内容，第 ${pageGroup.page} 页。`,
        content: `
          <header class="ssg-page-header">
            <h1 class="ssg-page-title">标签：#${escapeHtml(tag.name)}</h1>
            <p class="ssg-page-description">共 ${escapeHtml(String(tag.articleCount))} 项内容，第 ${escapeHtml(String(pageGroup.page))} 页。</p>
          </header>
          ${renderPaginatedMenuPage(paginatedTagPage, {
            currentPage: pageGroup.page,
            totalPages: pageGroup.totalPages,
            resolvePagePath: (page) => getTagPagePath(tag, page),
            basePath
          })}
        `
      })
    })
  })

  archive.forEach((group) => {
    const year = Number(group?.year)
    const articleCount = Number(group?.count) || (Array.isArray(group?.articles) ? group.articles.length : 0)

    if (!Number.isFinite(year)) {
      return
    }

    routes.push({
      path: getArchiveYearPath(year),
      pageTitle: `${year} 年归档`,
      description: `浏览 ${year} 年发布的归档内容，共 ${articleCount} 项。`,
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(`${year} 年归档`)}</h1>
          <p class="ssg-page-description">浏览 ${escapeHtml(String(year))} 年发布的归档内容。</p>
        </header>
        ${renderMenuPage({
          component: archiveComponent,
          items: createStaticContentCollectionItems(group?.articles || []),
          emptyText: '这一年还没有内容。'
        }, basePath)}
      `
    })
  })

  articles.forEach((article) => {
    routes.push({
      path: getArticlePath(article),
      isArticlePage: true,
      pageTitle: article.title,
      description: article.description || article.summary || article.excerpt,
      ogType: 'article',
      imageUrl: article.cover,
      lastmod: article.updatedAt || article.createdAt || article.date,
      content: renderArticleDetail(article, getRelatedArticles(article, articles), basePath, site, context.comment, context.sponsor)
    })
  })

  const customPages = await Promise.all(getCustomMenuPages(menus, routePatterns).map(async (page) => {
    const pageVariant = resolveMenuPageVariant(page)
    const loadedSource = await loadStaticMenuPageSource(page, pageVariant)
    const usesFileSource = pageVariant === 'context' && Boolean(page.file)
    const usesFolderSource = pageVariant !== 'context' && pageVariant !== 'friends' && Boolean(page.folder)
    const resolvedPage = {
      ...page,
      component: pageVariant,
      content: usesFileSource
        ? (loadedSource.content || '')
        : page.content,
      contentHtml: usesFileSource
        ? (loadedSource.contentHtml || '')
        : '',
      friendLinks: pageVariant === 'friends' ? friendLinks : [],
      items: usesFolderSource
        ? (Array.isArray(loadedSource.items) ? loadedSource.items : [])
        : Array.isArray(page.items) ? page.items : []
    }

    if (usesFileSource && !resolvedPage.description) {
      resolvedPage.description = loadedSource.description || ''
    }

    return {
      page: resolvedPage,
      records: usesFolderSource && Array.isArray(loadedSource.records) ? loadedSource.records : []
    }
  }))

  customPages.forEach(({ page, records }) => {
    const contentBlocks = splitMenuPageContent(page.content)

    routes.push({
      path: page.path,
      pageTitle: page.title,
      description: page.description || contentBlocks[0] || `${page.title} 页面`,
      content: `
        <header class="ssg-page-header">
          <h1 class="ssg-page-title">${escapeHtml(page.title)}</h1>
          ${page.description ? `<p class="ssg-page-description">${escapeHtml(page.description)}</p>` : ''}
        </header>
        ${renderMenuPage(page, basePath)}
      `
    })

    records.forEach((item) => {
      routes.push({
        path: item.to,
        pageTitle: item.title,
        description: item.detailDescription || item.description || `${item.title} - ${page.title}`,
        content: renderMenuPageDetail(page, item, basePath)
      })
    })
  })

  return routes
}

function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function writeSitemap(routes, siteUrl, basePath) {
  const entries = routes
    .filter(route => route.sitemap !== false)
    .map((route) => {
      const loc = buildAbsoluteUrl(siteUrl, basePath, route.path)

      if (!loc) {
        return null
      }

      const lastmod = formatDateIso(route.lastmod)

      return `
  <url>
    <loc>${xmlEscape(loc)}</loc>
    ${lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : ''}
  </url>`.trimEnd()
    })
    .filter(Boolean)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`

  await writeFile(path.join(DIST_DIR, 'sitemap.xml'), xml, 'utf8')
}

async function writeRss(articles, site, profile, siteUrl, basePath) {
  const channelTitle = toTrimmedString(site.title) || toTrimmedString(profile.display_name) || 'Blog'
  const channelDescription = toTrimmedString(site.description) || toTrimmedString(profile.tagline) || 'Blog feed'
  const channelLink = buildAbsoluteUrl(siteUrl, basePath, '/')
  const items = articles
    .slice(0, 20)
    .map((article) => {
      const link = buildAbsoluteUrl(siteUrl, basePath, resolveArticleHref(article))
      const pubDate = formatDateIso(article.createdAt || article.date)
      const description = article.description || article.summary || article.excerpt

      return `
  <item>
    <title>${xmlEscape(article.title)}</title>
    ${link ? `<link>${xmlEscape(link)}</link>` : ''}
    ${link ? `<guid>${xmlEscape(link)}</guid>` : ''}
    ${pubDate ? `<pubDate>${new Date(pubDate).toUTCString()}</pubDate>` : ''}
    ${description ? `<description><![CDATA[${description}]]></description>` : ''}
    <content:encoded><![CDATA[${article.content}]]></content:encoded>
  </item>`.trimEnd()
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${xmlEscape(channelTitle)}</title>
    ${channelLink ? `<link>${xmlEscape(channelLink)}</link>` : ''}
    <description>${xmlEscape(channelDescription)}</description>
${items}
  </channel>
</rss>
`

  await writeFile(path.join(DIST_DIR, 'rss.xml'), xml, 'utf8')
}

async function writeRobots(siteUrl, basePath) {
  const sitemapUrl = buildAbsoluteUrl(siteUrl, basePath, '/sitemap.xml')
  const content = [
    'User-agent: *',
    'Allow: /',
    sitemapUrl ? `Sitemap: ${sitemapUrl}` : ''
  ].filter(Boolean).join('\n')

  await writeFile(path.join(DIST_DIR, 'robots.txt'), `${content}\n`, 'utf8')
}

async function write404(template, context) {
  const html = renderPage({
    path: getNotFoundPath(),
    pageTitle: '页面未找到',
    description: '您访问的页面不存在。',
    robots: 'noindex,follow',
    staticPreview: true,
    content: `
      <header class="ssg-page-header">
        <h1 class="ssg-page-title">页面未找到</h1>
        <p class="ssg-page-description">这个链接可能已经失效，或者地址输入有误。</p>
      </header>
      <div class="ssg-empty">您可以返回首页，或继续浏览最新文章。</div>
    `
  }, {
    ...context,
    template
  })

  await writeFile(path.join(DIST_DIR, '404.html'), html, 'utf8')
}

async function writeNoJekyll() {
  await writeFile(path.join(DIST_DIR, '.nojekyll'), '\n', 'utf8')
}

async function main() {
  const basePath = resolveBasePath()
  const [template, configs, articles] = await Promise.all([
    readFile(path.join(DIST_DIR, 'index.html'), 'utf8'),
    loadConfigs(),
    loadArticles()
  ])
  const contentEntries = loadContentEntries()
  configureBlogRoutePatterns(configs?.site?.routing)
  const routePatterns = getBlogPathPatterns()
  const collections = buildCollections(contentEntries)
  const friendLinks = normalizeFriendLinks(configs.links.friend_links)
  const menus = normalizeMenuConfig(configs.site.menus)
  const themeCssFile = resolveThemeCssFile(configs.theme)
  const themeCssHref = themeCssFile ? withBasePath(basePath, themeCssFile) : ''
  const siteUrl = normalizeSiteUrl(configs.site.site_url || configs.site.url)
  const latestArticlesLimit = getMaxMenuSourceLimit(menus, 'latest-articles', ['sidebar'], 0)
  const latestArticles = articles.slice(0, latestArticlesLimit)
  const context = {
    template,
    site: configs.site,
    profile: configs.profile,
    announcement: normalizeAnnouncementConfig(configs.announcement),
    comment: normalizeCommentConfig(configs.comment),
    sponsor: normalizeSponsorConfig(configs.sponsor),
    articles,
    contentEntries,
    latestArticles,
    categories: collections.categories,
    tags: collections.tags,
    archive: collections.archive,
    friendLinks,
    menus,
    routePatterns,
    basePath,
    themeCssHref,
    pageSize: Number(configs.site?.pagination?.page_size) || 10
  }
  const routes = await createPageRoutes(context)

  await Promise.all(routes.map(async (route) => {
    const html = renderPage(route, context)
    await writeRouteFile(route.path, html)
  }))

  await write404(template, context)
  await writeNoJekyll()
  await writeSitemap(routes, siteUrl, basePath)
  await writeRss(articles, configs.site, configs.profile, siteUrl, basePath)
  await writeRobots(siteUrl, basePath)
}

main().catch((error) => {
  console.error('静态页面生成失败:', error)
  process.exitCode = 1
})
