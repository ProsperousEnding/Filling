import { parse } from 'smol-toml'

export function parseToml(tomlString) {
  return parse(String(tomlString ?? ''))
}
