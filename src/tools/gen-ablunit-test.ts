import { scaffoldTest } from '@breakit/abl-mcp-generators'
import type { ToolModule } from '../types.js'
import { mkdirSync, writeFileSync } from 'fs'
import { dirname } from 'path'

export default {
  name: 'gen-ablunit-test',
  description: 'Generate an ABLUnit test class that tests a business entity class directly',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' }, entityName: { type: 'string' }, tableName: { type: 'string' }, package: { type: 'string' }, outputDir: { type: 'string' },
      sourcePath: { type: 'string' },
      fields: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, dataType: { type: 'string' }, initial: { type: ['string', 'null'] } }, required: ['name', 'dataType'] } },
    },
    required: ['outputDir'],
  },
  category: 'generative',
  handler: async ({ name, entityName, tableName, package: pkg, outputDir, sourcePath, fields }: Record<string, unknown>) => {
    const f = fields as { name: string; dataType: string; initial?: string }[] | undefined
    const result = scaffoldTest({
      sourcePath: sourcePath as string | undefined,
      name: (name || entityName) as string,
      entityName: entityName as string,
      tableName: (tableName || '') as string,
      package: pkg as string,
      fields: (f || []).map(fi => ({ name: fi.name, dataType: fi.dataType, initial: fi.initial })),
      outputDir: outputDir as string,
    })
    mkdirSync(dirname(result.file), { recursive: true })
    writeFileSync(result.file, result.content, 'utf-8')
    return { content: [{ type: 'text', text: `📄 ${result.file}\n${result.content}` }] }
  },
} satisfies ToolModule
