import { buildDependencyGraph, findDeadCode, formatDeadCodeReport } from '@breakit/abl-mcp-core'
import type { ToolModule } from '../types.js'

export default {
  name: 'find-dead-code',
  description: 'Find unused functions, includes, and preprocessor defines across the project',
  inputSchema: { type: 'object', properties: { projectRoot: { type: 'string' } }, required: ['projectRoot'] },
  category: 'analytical',
  handler: async ({ projectRoot }: { projectRoot: string }) => {
    const graph = buildDependencyGraph(projectRoot)
    const report = findDeadCode(graph)
    return { content: [{ type: 'text', text: formatDeadCodeReport(report) }] }
  },
} satisfies ToolModule
