import { initAblParser } from '@breakit/abl-mcp-core'
import { extractFunctions } from '@breakit/abl-mcp-core'
import { readFileSync } from 'fs'
import type { ToolModule } from '../types.js'

export default {
  name: 'query-abl-symbols',
  description: 'List all function symbols defined in an ABL source file',
  inputSchema: { type: 'object', properties: { filePath: { type: 'string' } }, required: ['filePath'] },
  category: 'analytical',
  handler: async ({ filePath }: { filePath: string }) => {
    await initAblParser()
    const text = readFileSync(filePath, 'utf-8')
    const functions = extractFunctions(text, filePath)
    return { content: [{ type: 'text', text: functions.length ? functions.map(f => f.signature).join('\n') : 'No functions found.' }] }
  },
} satisfies ToolModule
