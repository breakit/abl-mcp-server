import { parseDf, formatDfSummary } from '@breakit/abl-mcp-core'
import { readFileSync } from 'fs'
import type { ToolModule } from '../types.js'

export default {
  name: 'read-df-file',
  description: 'Parse a .df schema file and return tables, fields, indexes, and sequences',
  inputSchema: { type: 'object', properties: { filePath: { type: 'string' } }, required: ['filePath'] },
  category: 'analytical',
  handler: async ({ filePath }: { filePath: string }) => {
    const text = readFileSync(filePath, 'utf-8')
    const tables = parseDf(text)
    return { content: [{ type: 'text', text: formatDfSummary(tables) }] }
  },
} satisfies ToolModule
