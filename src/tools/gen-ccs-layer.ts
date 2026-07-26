import { scaffoldCcsLayer } from '@breakit/abl-mcp-generators'
import type { ToolModule } from '../types.js'

export default {
  name: 'gen-ccs-layer',
  description: 'Generate the full CCS layer stack (BE + Service + Controller)',
  inputSchema: {
    type: 'object',
    properties: {
      package: { type: 'string' }, name: { type: 'string' }, entityName: { type: 'string' },
      fields: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, dataType: { type: 'string' }, initial: { type: ['string', 'null'] } }, required: ['name', 'dataType'] } },
    },
    required: ['package', 'name', 'entityName'],
  },
  category: 'generative',
  handler: async ({ package: pkg, name, entityName, fields }: Record<string, unknown>) => {
    const f = fields as { name: string; dataType: string; initial?: string }[] | undefined
    const result = scaffoldCcsLayer({ package: pkg as string, name: name as string, entityName: entityName as string, fields: (f || []).map(fi => ({ name: fi.name, dataType: fi.dataType, initial: fi.initial })) })
    return { content: [{ type: 'text', text: result.files.map(f => `📄 ${f.file}\n${f.content}`).join('\n---\n') }] }
  },
} satisfies ToolModule
