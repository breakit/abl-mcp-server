import { generateOpenApiSpec } from '@breakit/abl-mcp-core'
import type { ToolModule } from '../types.js'

export default {
  name: 'gen-openapi',
  description: 'Generate an OpenAPI 3.0 specification from @openapi.openedge.export annotations',
  inputSchema: { type: 'object', properties: { projectRoot: { type: 'string' } }, required: ['projectRoot'] },
  category: 'generative',
  handler: async ({ projectRoot }: { projectRoot: string }) => {
    const spec = generateOpenApiSpec(projectRoot)
    return { content: [{ type: 'text', text: spec }] }
  },
} satisfies ToolModule
