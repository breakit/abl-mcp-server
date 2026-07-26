import { loadConfig } from '@breakit/abl-mcp-core'
import type { ToolModule } from '../types.js'

export default {
  name: 'check-project-config',
  description: 'Read and return the project configuration from abl.toml',
  inputSchema: { type: 'object', properties: { projectRoot: { type: 'string' } }, required: ['projectRoot'] },
  category: 'analytical',
  handler: async ({ projectRoot }: { projectRoot: string }) => {
    const config = loadConfig(projectRoot)
    return { content: [{ type: 'text', text: [
        `Project root: ${config.projectRoot}`, `Schema dirs: ${config.schemaDirs.join(', ') || 'none'}`,
        `PROPATH: ${config.propath.join(', ') || 'none'}`, `Databases: ${Object.keys(config.databases).join(', ') || 'none'}`,
      ].join('\n') }] }
  },
} satisfies ToolModule
