import { lintProject, formatLintReport } from '@breakit/abl-mcp-core'
import type { ToolModule } from '../types.js'

export default {
  name: 'abl-lint',
  description: 'Lint ABL files for coding conventions (NO-UNDO, naming, deprecations)',
  inputSchema: { type: 'object', properties: { projectRoot: { type: 'string' } }, required: ['projectRoot'] },
  category: 'analytical',
  handler: async ({ projectRoot }: { projectRoot: string }) => {
    const report = lintProject(projectRoot)
    return { content: [{ type: 'text', text: formatLintReport(report) || 'No issues found.' }] }
  },
} satisfies ToolModule
