import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import type { MCPConfig, LoadedConfig } from './types.js'

const DEFAULT_TOOLS = [
  'read-abl-file', 'query-abl-symbols', 'read-df-file',
  'resolve-includes', 'list-project-files',
  'analyze-dependencies', 'df-diff', 'find-dead-code',
  'gen-abldoc', 'gen-ablunit-test',
]

function parseYaml(text: string): MCPConfig {
  const tools: { enabled: string[]; disabled: string[] } = { enabled: [...DEFAULT_TOOLS], disabled: [] }

  const lines = text.split('\n')
  let section = ''
  let inTools = false
  let currentList: string[] | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    if (trimmed.startsWith('tools:')) { inTools = true; continue }
    if (trimmed.startsWith('enabled:')) { currentList = tools.enabled; tools.enabled = []; continue }
    if (trimmed.startsWith('disabled:')) { currentList = tools.disabled; tools.disabled = []; continue }

    const listItem = trimmed.match(/^\s*-\s+(\S+)/)
    if (listItem && currentList) {
      currentList.push(listItem[1])
    }
  }

  return { tools }
}

export function loadConfig(cwd: string = process.cwd()): LoadedConfig {
  const yamlPath = resolve(cwd, 'abl-mcp-server.yaml')
  let config: MCPConfig = { tools: { enabled: [...DEFAULT_TOOLS], disabled: [] } }

  if (existsSync(yamlPath)) {
    try {
      const text = readFileSync(yamlPath, 'utf-8')
      config = parseYaml(text)
    } catch {
      // Invalid config, fall through to defaults
    }
  }

  const enabledSet = new Set(config.tools.enabled)
  for (const d of config.tools.disabled) enabledSet.delete(d)

  return {
    allToolNames: DEFAULT_TOOLS,
    isEnabled(name: string): boolean {
      return enabledSet.has(name)
    },
  }
}
