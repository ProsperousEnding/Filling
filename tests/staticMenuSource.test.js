import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { loadStaticMenuPageSource } from '../scripts/generate-static.mjs'

const temporaryDirectories = []

test.after(async () => {
  await Promise.all(temporaryDirectories.map(directory => rm(directory, {
    recursive: true,
    force: true
  })))
})

async function createContentDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'vue-blog-static-menu-'))
  temporaryDirectories.push(directory)
  return directory
}

test('static menu sources expose configured file read failures', async () => {
  const contentDirectory = await createContentDirectory()

  await assert.rejects(
    loadStaticMenuPageSource(
      { key: 'about', file: 'missing.md' },
      'context',
      null,
      null,
      null,
      contentDirectory
    ),
    error => (
      error.message.includes('about')
      && error.message.includes('blog/content/missing.md')
    )
  )
})

test('static menu sources expose configured directory read failures', async () => {
  const contentDirectory = await createContentDirectory()

  await assert.rejects(
    loadStaticMenuPageSource(
      { key: 'projects', folder: 'missing', path: '/projects' },
      'grid',
      null,
      null,
      null,
      contentDirectory
    ),
    error => (
      error.message.includes('projects')
      && error.message.includes('blog/content/missing')
    )
  )
})
