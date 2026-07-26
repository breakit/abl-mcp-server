import { lintProject, formatLintReport, type LintRuleSpec } from '@breakit/abl-mcp-core'
import { loadConfig } from '../config-loader.js'
import type { ToolModule } from '../types.js'

export default {
  name: 'abl-lint',
  description: 'Lint ABL files using 33 Prolint-inspired rules defined in config.yaml',
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

    // Load config — server defaults + project overrides
    const config = loadConfig(projectRoot)

    // Parse inline rules from tool args (highest priority)
    const inlineRules: Record<string, LintRuleSpec> = {}
    for (const r of (args.rules || []) as { name: string; pattern: string; message: string; severity?: string; filePattern?: string }[]) {
      inlineRules[r.name] = {
        pattern: r.pattern,
        message: r.message,
        severity: (r.severity === 'error' ? 'error' : 'warning') as 'warning' | 'error',
        filePattern: r.filePattern,
      }
    }

    // Merge: config defaults < project overrides < inline rules
    const rules: Record<string, LintRuleSpec> = { ...config.lintRules, ...inlineRules }

    if (args.listRules) {
      const lines: string[] = [`Lint rules loaded: ${Object.keys(rules).length}`]
      for (const [name, spec] of Object.entries(rules)) {
        const pattern = spec.pattern || '(special)'
        const fp = spec.filePattern ? ` [${spec.filePattern}]` : ''
        lines.push(`  ${name}  [${spec.severity}]${fp}  ${spec.message}`)
      }
      lines.push('', 'To override: add a lint.rules section to your abl-mcp-server.yaml')
      return { content: [{ type: 'text', text: lines.join('\n') }] }
    }

    const report = lintProject(projectRoot, rules)
    return { content: [{ type: 'text', text: formatLintReport(report) }] }
  },
} satisfies ToolModule
