import { scaffoldFullEntity } from '@breakit/abl-mcp-generators'
import type { ToolModule } from '../types.js'

export default {
  name: 'gen-business-entity',
  description: 'Generate a BE .cls, Service, and Controller for a business entity',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' }, tableName: { type: 'string' }, package: { type: 'string' }, outputDir: { type: 'string' },
      fields: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, dataType: { type: 'string' }, initial: { type: ['string', 'null'] } }, required: ['name', 'dataType'] } },
    },
    required: ['name', 'tableName', 'package', 'outputDir'],
  },
  category: 'generative',
  handler: async ({ name, tableName, package: pkg, outputDir, fields }: Record<string, unknown>) => {
    const f = fields as { name: string; dataType: string; initial?: string }[] | undefined
    const files = scaffoldFullEntity({ entityName: name as string, package: pkg as string, tableName: tableName as string, fields: (f || []).map(fi => ({ name: fi.name, dataType: fi.dataType, initial: fi.initial })), outputDir: outputDir as string })
    return { content: [{ type: 'text', text: files.map(f => `📄 ${f.file}\n${f.content}`).join('\n---\n') }] }
  },
} satisfies ToolModule
