import { findProjectFiles } from '@breakit/abl-mcp-core'
import type { ToolModule } from '../types.js'

export default {
  name: 'list-project-files',
  description: 'List all ABL source files in a project directory',
  inputSchema: { type: 'object', properties: { projectRoot: { type: 'string' } }, required: ['projectRoot'] },
  category: 'analytical',
  handler: async ({ projectRoot }: { projectRoot: string }) => {
    const files = findProjectFiles(projectRoot)
    return { content: [{ type: 'text', text: files.length ? files.join('\n') : 'No ABL source files found.' }] }
  },
} satisfies ToolModule
