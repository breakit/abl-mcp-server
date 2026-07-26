import { scaffoldTest } from '@breakit/abl-mcp-generators'
import type { ToolModule } from '../types.js'

export default {
  name: 'gen-ablunit-test',
  description: 'Generate an ABLUnit test class with ProDataSet-driven CRUD tests',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' }, entityName: { type: 'string' }, tableName: { type: 'string' }, package: { type: 'string' }, outputDir: { type: 'string' },
      fields: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, dataType: { type: 'string' }, initial: { type: ['string', 'null'] } }, required: ['name', 'dataType'] } },
    },
    required: ['name', 'entityName', 'tableName', 'package', 'outputDir'],
  },
  category: 'generative',
  handler: async ({ name, entityName, tableName, package: pkg, outputDir, fields }: Record<string, unknown>) => {
    const f = fields as { name: string; dataType: string; initial?: string }[] | undefined
    const result = scaffoldTest({ name: name as string, entityName: entityName as string, tableName: tableName as string, package: pkg as string, fields: (f || []).map(fi => ({ name: fi.name, dataType: fi.dataType, initial: fi.initial })), outputDir: outputDir as string })
    return { content: [{ type: 'text', text: `📄 ${result.file}\n${result.content}` }] }
  },
} satisfies ToolModule
