import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { readFirstTomlConfig } from '../scripts/read-toml-config.mjs'

const temporaryDirectories = []

test.after(async () => {
  await Promise.all(temporaryDirectories.map(directory => rm(directory, {
    recursive: true,
    force: true
  })))
})

async function createTemporaryDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'vue-blog-toml-'))
  temporaryDirectories.push(directory)
  return directory
}

test('TOML config loading falls back only when a candidate does not exist', async () => {
  const directory = await createTemporaryDirectory()
  const missingPath = path.join(directory, 'missing.toml')
  const validPath = path.join(directory, 'valid.toml')
  await writeFile(validPath, 'title = "Fallback"\n', 'utf8')

  assert.deepEqual(
    await readFirstTomlConfig([missingPath, validPath]),
    { title: 'Fallback' }
  )
})

test('invalid TOML fails with its file path instead of using another candidate', async () => {
  const directory = await createTemporaryDirectory()
  const invalidPath = path.join(directory, 'invalid.toml')
  const validPath = path.join(directory, 'valid.toml')
  await writeFile(invalidPath, 'title = "unterminated\n', 'utf8')
  await writeFile(validPath, 'title = "Should not load"\n', 'utf8')

  await assert.rejects(
    readFirstTomlConfig([invalidPath, validPath]),
    error => error.message.includes(invalidPath) && error.message.includes('Failed to parse TOML config')
  )
})
