import { readFile } from 'node:fs/promises'

import { parseToml } from '../src/framework/utils/tomlParser.js'

export async function readFirstTomlConfig(candidatePaths = []) {
  for (const filePath of candidatePaths) {
    let source

    try {
      source = await readFile(filePath, 'utf8')
    } catch (error) {
      if (error?.code === 'ENOENT') {
        continue
      }

      throw new Error(`Failed to read TOML config ${filePath}: ${error.message}`, { cause: error })
    }

    try {
      return parseToml(source)
    } catch (error) {
      throw new Error(`Failed to parse TOML config ${filePath}: ${error.message}`, { cause: error })
    }
  }

  return {}
}
