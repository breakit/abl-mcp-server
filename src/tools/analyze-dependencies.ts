import { buildDependencyGraph, formatDependencyGraph } from '@breakit/abl-mcp-core'
import type { ToolModule } from '../types.js'

export default {
  name: 'analyze-dependencies',
  description: 'Build a full dependency graph of all ABL files',
  inputSchema: { type: 'object', properties: { projectRoot: { type: 'string' } }, required: ['projectRoot'] },
  category: 'analytical',
  handler: async ({ projectRoot }: { projectRoot: string }) => {
    const graph = buildDependencyGraph(projectRoot)
    return { content: [{ type: 'text', text: formatDependencyGraph(graph) }] }
  },
} satisfies ToolModule
