import { generateJsonSchema } from '@breakit/abl-mcp-core'
import type { ToolModule } from '../types.js'

export default {
  name: 'gen-contract-json-schema',
  description: 'Generate a JSON Schema from a table/field definition',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' }, description: { type: ['string', 'null'] },
      fields: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, dataType: { type: 'string' }, required: { type: ['boolean', 'null'] } }, required: ['name', 'dataType'] } },
    },
    required: ['name', 'fields'],
  },
  category: 'generative',
  handler: async ({ name, description, fields }: Record<string, unknown>) => {
    const f = fields as { name: string; dataType: string; required?: boolean }[] | undefined
    const content = generateJsonSchema({ name: name as string, description: description as string | undefined, fields: f || [] })
    return { content: [{ type: 'text', text: content }] }
  },
} satisfies ToolModule
