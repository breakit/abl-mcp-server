import { findAnnotations, findAnnotationsInProject, formatAnnotations } from '@breakit/abl-mcp-core'
import type { ToolModule } from '../types.js'

export default {
  name: 'find-annotations',
  description: 'Find TODO, FIXME, HACK, XXX, NOTE and similar annotation comments in ABL code',
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: { type: 'string' },
      filePath: { type: 'string' },
    },
    required: [],
  },
  category: 'analytical',
  handler: async (args: Record<string, unknown>) => {
    const projectRoot = args.projectRoot as string | undefined
    const filePath = args.filePath as string | undefined

    if (projectRoot) {
      const results = findAnnotationsInProject(projectRoot)
      return { content: [{ type: 'text', text: formatAnnotations(results) }] }
    }
    if (filePath) {
      const { readFileSync } = await import('fs')
      try {
        const source = readFileSync(filePath, 'utf-8')
        const results = findAnnotations(source, filePath)
        return { content: [{ type: 'text', text: formatAnnotations(results) }] }
      } catch {
        return { content: [{ type: 'text', text: `Could not read file: ${filePath}` }] }
      }
    }

    return { content: [{ type: 'text', text: 'Specify either filePath (single file) or projectRoot (scan all files).' }] }
  },
} satisfies ToolModule
