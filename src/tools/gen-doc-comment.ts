import { generateDocComment } from '@breakit/abl-mcp-generators'
import type { ToolModule } from '../types.js'

export default {
  name: 'gen-doc-comment',
  description: 'Generate a formatted ABLDoc (/** */) comment block for a class, method, function, or procedure',
  inputSchema: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['class', 'method', 'function', 'procedure'] },
      name: { type: 'string' },
      description: { type: ['string', 'null'] },
      params: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, dataType: { type: 'string' }, description: { type: ['string', 'null'] } }, required: ['name', 'dataType'] } },
      returnType: { type: ['string', 'null'] },
      returnDesc: { type: ['string', 'null'] },
      author: { type: ['string', 'null'] },
      notes: { type: 'array', items: { type: 'string' } },
    },
    required: ['type', 'name'],
  },
  category: 'generative',
  handler: async (args: Record<string, unknown>) => {
    const comment = generateDocComment({
      type: args.type as 'class' | 'method' | 'function' | 'procedure',
      name: args.name as string,
      description: args.description as string | undefined,
      params: args.params as { name: string; dataType: string; description?: string }[] | undefined,
      returnType: args.returnType as string | undefined,
      returnDesc: args.returnDesc as string | undefined,
      author: args.author as string | undefined,
      notes: args.notes as string[] | undefined,
    })
    return { content: [{ type: 'text', text: comment }] }
  },
} satisfies ToolModule
