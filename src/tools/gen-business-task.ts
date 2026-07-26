import { generateBusinessTask } from '@breakit/abl-mcp-generators'
import type { ToolModule } from '../types.js'

export default {
  name: 'gen-business-task',
  description: 'Generate a standalone Business Task .cls with ProDataSet input/output, Execute method, and REST annotations',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' }, package: { type: 'string' }, description: { type: ['string', 'null'] },
      inputFields: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, dataType: { type: 'string' } }, required: ['name', 'dataType'] } },
      outputFields: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, dataType: { type: 'string' } }, required: ['name', 'dataType'] } },
    },
    required: ['name', 'package', 'inputFields', 'outputFields'],
  },
  category: 'generative',
  handler: async (args: Record<string, unknown>) => {
    const content = generateBusinessTask({ package: args.package as string, name: args.name as string, description: args.description as string | undefined, inputFields: (args.inputFields || []) as { name: string; dataType: string }[], outputFields: (args.outputFields || []) as { name: string; dataType: string }[] })
    return { content: [{ type: 'text', text: content }] }
  },
} satisfies ToolModule
