import { generateTempTableInclude } from '@breakit/abl-mcp-core'
import type { ToolModule } from '../types.js'

export default {
  name: 'gen-contract-tt',
  description: 'Generate a temp-table include (.i) file from schema fields',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' }, tableName: { type: ['string', 'null'] },
      fields: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, dataType: { type: 'string' }, extent: { type: ['integer', 'null'] }, required: { type: ['boolean', 'null'] }, initial: { type: ['string', 'null'] } }, required: ['name', 'dataType'] } },
    },
    required: ['name', 'fields'],
  },
  category: 'generative',
  handler: async ({ name, tableName, fields }: Record<string, unknown>) => {
    const f = fields as { name: string; dataType: string; extent?: number; required?: boolean; initial?: string }[] | undefined
    const content = generateTempTableInclude({ name: name as string, tableName: tableName as string | undefined, fields: f || [] })
    return { content: [{ type: 'text', text: content }] }
  },
} satisfies ToolModule
