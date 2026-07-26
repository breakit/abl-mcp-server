import { generateWorkflow } from '@breakit/abl-mcp-generators'
import type { ToolModule } from '../types.js'

export default {
  name: 'gen-workflow',
  description: 'Generate a workflow .cls with Execute + step methods, ProDataSet context, and REST annotations',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' }, package: { type: 'string' }, description: { type: ['string', 'null'] }, initialStatus: { type: 'string', default: 'pending' },
      payloadTable: { type: ['string', 'null'] },
      contextFields: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, dataType: { type: 'string' }, initial: { type: ['string', 'null'] } }, required: ['name', 'dataType'] } },
      steps: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, description: { type: ['string', 'null'] }, nextStep: { type: ['string', 'null'] }, nextStatus: { type: ['string', 'null'] } }, required: ['name'] } },
    },
    required: ['name', 'package', 'steps'],
  },
  category: 'generative',
  handler: async (args: Record<string, unknown>) => {
    const content = generateWorkflow({ package: args.package as string, name: args.name as string, description: args.description as string | undefined, initialStatus: (args.initialStatus as string) || 'pending', payloadTable: args.payloadTable as string | undefined, contextFields: (args.contextFields || []) as { name: string; dataType: string; initial?: string }[], steps: (args.steps || []) as { name: string; description?: string; nextStep?: string; nextStatus?: string }[] })
    return { content: [{ type: 'text', text: content }] }
  },
} satisfies ToolModule
