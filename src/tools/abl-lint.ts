import { lintProject, formatLintReport, getBuiltInRules, type LintRuleSpec } from '@breakit/abl-mcp-core'
import { loadConfig } from '../config-loader.js'
import type { ToolModule } from '../types.js'

export default {
  name: 'abl-lint',
  description: 'Lint ABL files for coding conventions (NO-UNDO, naming, deprecations, ~30 Prolint-inspired rules)',
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: { type: 'string' },
      listRules: { type: 'boolean' },
      rules: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            pattern: { type: 'string' },
            message: { type: 'string' },
            severity: { type: 'string', enum: ['warning', 'error'] },
            filePattern: { type: ['string', 'null'] },
          },
          required: ['name', 'pattern', 'message'],
        },
      },
    },
    required: ['projectRoot'],
  },
  category: 'analytical',
  handler: async (args: Record<string, unknown>) => {
    const projectRoot = args.projectRoot as string
    const listRules = args.listRules as boolean | undefined

    if (listRules) {
      const builtIn = getBuiltInRules()
      const lines: string[] = ['Built-in rules (use these names in abl-mcp-server.yaml to override):']
      for (const [name, spec] of Object.entries(builtIn)) {
        lines.push(`  ${name}  [${spec.severity}] ${spec.message}`)
      }
      return { content: [{ type: 'text', text: lines.join('\n') }] }
    }

    // Load YAML config for per-project rules
    const config = loadConfig(projectRoot)
    const yamlRules: Record<string, LintRuleSpec> = config.lintRules || {}

    // Parse inline rules from tool args
    const inlineRules: Record<string, LintRuleSpec> = {}
    for (const r of (args.rules || []) as { name: string; pattern: string; message: string; severity?: string; filePattern?: string }[]) {
      inlineRules[r.name] = {
        pattern: r.pattern,
        message: r.message,
        severity: (r.severity === 'error' ? 'error' : 'warning') as 'warning' | 'error',
        filePattern: r.filePattern,
      }
    }

    // Merge: inline rules override YAML rules
    const extraRules = { ...yamlRules, ...inlineRules }

    const report = lintProject(projectRoot, Object.keys(extraRules).length > 0 ? extraRules : undefined)
    return { content: [{ type: 'text', text: formatLintReport(report) }] }
  },
} satisfies ToolModule
