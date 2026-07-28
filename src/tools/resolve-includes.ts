import { initAblParser, loadPropath, resolveIncludes } from '@breakit/abl-mcp-core'
import { readFileSync } from 'fs'
import type { ToolModule } from '../types.js'

export default {
  name: 'resolve-includes',
  description: 'Resolve all {include} paths in an ABL file against the project PROPATH',
  inputSchema: { type: 'object', properties: { filePath: { type: 'string' }, projectRoot: { type: 'string' } }, required: ['filePath', 'projectRoot'] },
  category: 'analytical',
  handler: async ({ filePath, projectRoot }: { filePath: string; projectRoot: string }) => {
    await initAblParser()
    const text = readFileSync(filePath, 'utf-8')
    const propath = loadPropath(projectRoot)
    const resolved = resolveIncludes(text, filePath, propath)
    return { content: [{ type: 'text', text: resolved.includes.map(i => `  ${i.rawPath} → ${i.resolvedPath || 'NOT FOUND'}`).join('\n') || 'No includes found.' }] }
  },
} satisfies ToolModule
