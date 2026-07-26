import { readFileSync, existsSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import type { MCPConfig, LoadedConfig, LintRuleSpec } from './types.js'

let __dirname: string
try { __dirname = dirname(fileURLToPath(import.meta.url)) } catch { __dirname = process.cwd() }

function findConfigYaml(): string {
  const candidates = [
    resolve(__dirname, '..', 'config.yaml'),           // dist/ → ../config.yaml
    resolve(__dirname, 'config.yaml'),                 // root → config.yaml
    join(process.cwd(), 'config.yaml'),                 // CWD fallback
  ]
  for (const c of candidates) if (existsSync(c)) return c
  return candidates[0]
}
const SERVER_CONFIG = findConfigYaml()

const DEFAULT_TOOLS = [
  'read-abl-file', 'query-abl-symbols', 'read-df-file',
  'resolve-includes', 'list-project-files',
  'analyze-dependencies', 'df-diff', 'find-dead-code', 'find-annotations', 'abl-lint',
  'gen-doc-comment', 'gen-abldoc', 'gen-ablunit-test',
]

function getIndent(line: string): number {
  const match = line.match(/^(\s*)/)
  return match ? match[0].length : 0
}

function parseYaml(text: string): MCPConfig {
  const tools: { enabled: string[]; disabled: string[] } = { enabled: [...DEFAULT_TOOLS], disabled: [] }
  const lintRules: Record<string, LintRuleSpec> = {}

  const lines = text.split('\n')
  let currentList: string[] | null = null
  let inLint = false
  let currentRuleName = ''
  let currentRule: Partial<LintRuleSpec> = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    if (trimmed === 'tools:') { inLint = false; continue }
    if (trimmed === 'enabled:') { tools.enabled = []; currentList = tools.enabled; continue }
    if (trimmed === 'disabled:') { tools.disabled = []; currentList = tools.disabled; continue }

    if (trimmed === 'lint:') { inLint = true; currentList = null; continue }

    if (inLint) {
      if (trimmed === 'rules:') {
        if (currentRuleName && currentRule.message) {
          lintRules[currentRuleName] = {
            pattern: currentRule.pattern || undefined,
            message: currentRule.message,
            severity: currentRule.severity || 'warning',
            filePattern: currentRule.filePattern,
          }
        }
        currentRuleName = ''
        currentRule = {}
        continue
      }

      const ruleMatch = trimmed.match(/^(\w[\w-]*):$/)
      if (ruleMatch) {
        if (currentRuleName && currentRule.message) {
          lintRules[currentRuleName] = {
            pattern: currentRule.pattern || undefined,
            message: currentRule.message,
            severity: currentRule.severity || 'warning',
            filePattern: currentRule.filePattern,
          }
        }
        currentRuleName = ruleMatch[1]
        currentRule = {}
        continue
      }

      const propMatch = trimmed.match(/^(\w+):\s+(.*)/)
      if (propMatch && currentRuleName) {
        const [, key, val] = propMatch
        const cleanVal = val.replace(/^['"]|['"]$/g, '').trim()
        switch (key) {
          case 'pattern': currentRule.pattern = cleanVal; break
          case 'message': currentRule.message = cleanVal; break
          case 'severity':
            currentRule.severity = (cleanVal === 'error' ? 'error' : 'warning') as 'warning' | 'error'
            break
          case 'filePattern': currentRule.filePattern = cleanVal; break
        }
        continue
      }

      continue
    }

    const listItem = trimmed.match(/^\s*-\s+(\S+)/)
    if (listItem && currentList) {
      currentList.push(listItem[1])
    }
  }

  if (currentRuleName && currentRule.message) {
    lintRules[currentRuleName] = {
      pattern: currentRule.pattern || undefined,
      message: currentRule.message,
      severity: currentRule.severity || 'warning',
      filePattern: currentRule.filePattern,
    }
  }

  return { tools, lint: { rules: Object.keys(lintRules).length > 0 ? lintRules : undefined } }
}

export function loadConfig(cwd: string = process.cwd()): LoadedConfig {
  // Load server defaults from bundled config.yaml
  let baseConfig: MCPConfig = { tools: { enabled: [...DEFAULT_TOOLS], disabled: [] } }
  let baseLintRules: Record<string, LintRuleSpec> = {}

  if (existsSync(SERVER_CONFIG)) {
    try {
      const text = readFileSync(SERVER_CONFIG, 'utf-8')
      baseConfig = parseYaml(text)
      baseLintRules = baseConfig.lint?.rules || {}
    } catch { /* use fallback */ }
  }

  // Overlay project config (abl-mcp-server.yaml)
  const projPath = resolve(cwd, 'abl-mcp-server.yaml')
  let toolEnabled = baseConfig.tools.enabled
  let toolDisabled = baseConfig.tools.disabled
  let lintRules = { ...baseLintRules }

  if (existsSync(projPath)) {
    try {
      const text = readFileSync(projPath, 'utf-8')
      const projConfig = parseYaml(text)
      // If project has its own enabled list, use it; otherwise keep defaults
      if (projConfig.tools.enabled.length > 0) {
        toolEnabled = projConfig.tools.enabled
      }
      if (projConfig.tools.disabled.length > 0) {
        toolDisabled = projConfig.tools.disabled
      }
      // Merge project lint rules over base
      if (projConfig.lint?.rules) {
        Object.assign(lintRules, projConfig.lint.rules)
      }
    } catch { /* keep defaults */ }
  }

  const enabledSet = new Set(toolEnabled)
  for (const d of toolDisabled) enabledSet.delete(d)

  return {
    allToolNames: DEFAULT_TOOLS,
    isEnabled(name: string): boolean {
      return enabledSet.has(name)
    },
    lintRules,
  }
}
