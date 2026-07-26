import { generateDataSetInclude } from '@breakit/abl-mcp-contracts'
import type { ToolModule } from '../types.js'

export default {
  name: 'gen-contract-ds',
  description: 'Generate a ProDataSet include (.i) file wrapping the temp-table',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' }, tableName: { type: ['string', 'null'] },
      fields: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, dataType: { type: 'string' } }, required: ['name', 'dataType'] } },
    },
    required: ['name', 'fields'],
  },
  category: 'generative',
  handler: async ({ name, tableName, fields }: Record<string, unknown>) => {
    const f = fields as { name: string; dataType: string }[] | undefined
    const content = generateDataSetInclude({ name: name as string, tableName: tableName as string | undefined, fields: f || [] })
    return { content: [{ type: 'text', text: content }] }
  },
} satisfies ToolModule
