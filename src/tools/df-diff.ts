import { diffDfFiles, formatDfDiff } from '@breakit/abl-mcp-core'
import { readFileSync } from 'fs'
import type { ToolModule } from '../types.js'

export default {
  name: 'df-diff',
  description: 'Compare two .df schema files',
  inputSchema: { type: 'object', properties: { oldDfPath: { type: 'string' }, newDfPath: { type: 'string' } }, required: ['oldDfPath', 'newDfPath'] },
  category: 'analytical',
  handler: async ({ oldDfPath, newDfPath }: { oldDfPath: string; newDfPath: string }) => {
    const oldText = readFileSync(oldDfPath, 'utf-8')
    const newText = readFileSync(newDfPath, 'utf-8')
    const diff = diffDfFiles(oldText, newText)
    return { content: [{ type: 'text', text: formatDfDiff(diff) || 'No differences found.' }] }
  },
} satisfies ToolModule
