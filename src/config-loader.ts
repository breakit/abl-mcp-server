import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import type { MCPConfig, LoadedConfig, LintRuleSpec } from './types.js'

const DEFAULT_TOOLS = [
  'read-abl-file', 'query-abl-symbols', 'read-df-file',
  'resolve-includes', 'list-project-files',
  'analyze-dependencies', 'df-diff', 'find-dead-code', 'abl-lint',
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
  let inRules = false
  let currentRuleName = ''
  let currentRule: Partial<LintRuleSpec> = {}
  const lintIndent = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    if (trimmed.startsWith('tools:')) { inLint = false; continue }
    if (trimmed.startsWith('enabled:')) { currentList = tools.enabled; tools.enabled = []; continue }
    if (trimmed.startsWith('disabled:')) { currentList = tools.disabled; tools.disabled = []; continue }

    if (trimmed.startsWith('lint:')) { inLint = true; currentList = null; continue }

    if (inLint) {
      const indent = getIndent(line)

      if (trimmed.startsWith('rules:')) {
        inRules = true
        // Save any previous rule
        if (currentRuleName && currentRule.pattern && currentRule.message) {
          lintRules[currentRuleName] = {
            pattern: currentRule.pattern,
            message: currentRule.message,
            severity: currentRule.severity || 'warning',
            filePattern: currentRule.filePattern,
          }
        }
        currentRuleName = ''
        currentRule = {}
        continue
      }

      if (inRules) {
        // Rule name: starts with a word followed by colon (at indentation level)
        const ruleMatch = trimmed.match(/^(\w[\w-]*):$/)
        if (ruleMatch && indent >= 2 && indent <= 6) {
          // Save previous rule
          if (currentRuleName && currentRule.pattern && currentRule.message) {
            lintRules[currentRuleName] = {
              pattern: currentRule.pattern,
              message: currentRule.message,
              severity: currentRule.severity || 'warning',
              filePattern: currentRule.filePattern,
            }
          }
          currentRuleName = ruleMatch[1]
          currentRule = {}
          continue
        }

        // Rule property: key: value
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
      }

      continue
    }

    const listItem = trimmed.match(/^\s*-\s+(\S+)/)
    if (listItem && currentList) {
      currentList.push(listItem[1])
    }
  }

  // Save last rule
  if (currentRuleName && currentRule.pattern && currentRule.message) {
    lintRules[currentRuleName] = {
      pattern: currentRule.pattern,
      message: currentRule.message,
      severity: currentRule.severity || 'warning',
      filePattern: currentRule.filePattern,
    }
  }

  return { tools, lint: { rules: lintRules } }
}

export function loadConfig(cwd: string = process.cwd()): LoadedConfig {
  const yamlPath = resolve(cwd, 'abl-mcp-server.yaml')
  let config: MCPConfig = { tools: { enabled: [...DEFAULT_TOOLS], disabled: [] } }
  let lintRules: Record<string, LintRuleSpec> = {}

  if (existsSync(yamlPath)) {
    try {
      const text = readFileSync(yamlPath, 'utf-8')
      config = parseYaml(text)
      lintRules = config.lint?.rules || {}
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
    lintRules,
  }
}
