import { scaffoldProject } from '@breakit/abl-mcp-generators'
import type { ToolModule } from '../types.js'

export default {
  name: 'init-project',
  description: 'Scaffold a new ABL project with directory structure, abl.toml, and starter files',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string' }, package: { type: 'string' }, description: { type: ['string', 'null'] }, outputDir: { type: 'string' } },
    required: ['name', 'package', 'outputDir'],
  },
  category: 'generative',
  handler: async ({ name, package: pkg, description, outputDir }: Record<string, unknown>) => {
    const files = scaffoldProject({ name: name as string, package: pkg as string, description: description as string | undefined, outputDir: outputDir as string })
    return { content: [{ type: 'text', text: files.map(f => `📄 ${f.path}\n${f.content}`).join('\n---\n') }] }
  },
} satisfies ToolModule
