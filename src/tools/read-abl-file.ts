import { initAblParser, parseAblFile } from '@breakit/abl-mcp-core'
import { readFileSync, existsSync } from 'fs'
import type { ToolModule } from '../types.js'

function formatFunctionSignature(name: string, parameters: { name: string; direction: string; dataType: string | null }[]): string {
  const params = parameters.map((parameter) => {
    const dataType = parameter.dataType ? ` ${parameter.dataType}` : ''
    return `${parameter.direction} ${parameter.name}${dataType}`
  })

  return `${name}(${params.join(', ')})`
}

export default {
  name: 'read-abl-file',
  description: 'Parse an ABL file and return its structure (functions, includes, preprocessor defines)',
  inputSchema: { type: 'object', properties: { filePath: { type: 'string' } }, required: ['filePath'] },
  category: 'analytical',
  handler: async ({ filePath }: { filePath: string }) => {
    if (!filePath) return { content: [{ type: 'text', text: 'Error: filePath is required' }] }
    if (!existsSync(filePath)) return { content: [{ type: 'text', text: `File not found: ${filePath}` }] }
    try { await initAblParser() } catch {
      return { content: [{ type: 'text', text: 'Tree-sitter parser not available (wasm binary missing)' }] }
    }
    const text = readFileSync(filePath, 'utf-8')
    const result = parseAblFile(text)
    return {
      content: [{
        type: 'text',
        text: [
          `Functions (${result.functions.length}):`,
          ...result.functions.map(f => `  ${formatFunctionSignature(f.name, f.parameters)} (line ${f.startLine + 1}-${f.endLine + 1})`),
          '', `Includes (${result.includes.length}):`,
          ...result.includes.map(i => `  ${i.path} (line ${i.line + 1})`),
          '', `Preprocessor defines (${result.preprocessorDefines.length}):`,
          ...result.preprocessorDefines.map(d => `  &${d.name}${d.value ? ` = ${d.value}` : ''}`),
          '', `Preprocessor refs (${result.preprocessorRefs.length}):`,
          ...result.preprocessorRefs.map(r => `  {&${r.name}}`),
        ].join('\n'),
      }],
    }
  },
} satisfies ToolModule
