import { generateAbldocHtml } from '@breakit/abl-mcp-doc'
import type { ToolModule } from '../types.js'

export default {
  name: 'gen-abldoc',
  description: 'Generate HTML documentation from existing ABLDoc comments in a project',
  inputSchema: { type: 'object', properties: { projectRoot: { type: 'string' }, title: { type: ['string', 'null'] } }, required: ['projectRoot'] },
  category: 'generative',
  handler: async ({ projectRoot, title }: { projectRoot: string; title?: string }) => {
    const result = generateAbldocHtml(projectRoot, title)
    return { content: [{ type: 'text', text: `📄 ${result.file}\n${result.content}` }] }
  },
} satisfies ToolModule
