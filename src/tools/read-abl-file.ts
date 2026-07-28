import { initAblParser, parseAblFile } from '@breakit/abl-mcp-core'
import { readFileSync, existsSync } from 'fs'
import type { ToolModule } from '../types.js'

function formatParams(params: { name: string; direction: string; dataType: string | null }[]): string {
  return params.map(p => {
    const dt = p.dataType ? ` ${p.dataType}` : ''
    return `${p.direction} ${p.name}${dt}`
  }).join(', ')
}

export default {
  name: 'read-abl-file',
  description: 'Parse an ABL file and return its structure (class, methods, constructors, functions, includes, preprocessor defines)',
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
    const lines: string[] = []

    if (result.classInfo) {
      const c = result.classInfo
      lines.push(`Class: ${c.fullName}`)
      if (c.inherits) lines.push(`  Inherits: ${c.inherits}`)
      if (c.implements.length) lines.push(`  Implements: ${c.implements.join(', ')}`)
      lines.push('')
    }

    lines.push(`Constructors (${result.constructors.length}):`)
    for (const ctor of result.constructors) {
      lines.push(`  ${ctor.visibility} ${ctor.name}(${formatParams(ctor.parameters)}) (line ${ctor.startLine + 1})`)
    }
    lines.push('')

    lines.push(`Methods (${result.methods.length}):`)
    for (const m of result.methods) {
      const ret = m.returnType.toLowerCase() !== 'void' ? m.returnType + ' ' : ''
      lines.push(`  ${m.visibility} ${ret}${m.name}(${formatParams(m.parameters)}) (line ${m.startLine + 1}-${m.endLine + 1})`)
    }
    lines.push('')

    lines.push(`Functions (${result.functions.length}):`)
    for (const f of result.functions) {
      lines.push(`  ${f.name}(${formatParams(f.parameters)}) (line ${f.startLine + 1}-${f.endLine + 1})`)
    }
    lines.push('')

    lines.push(`Includes (${result.includes.length}):`)
    for (const i of result.includes) {
      lines.push(`  ${i.path} (line ${i.line + 1})`)
    }
    lines.push('')

    lines.push(`Using statements (${result.usingStatements.length}):`)
    for (const u of result.usingStatements) {
      lines.push(`  ${u.path} (line ${u.line + 1})`)
    }
    lines.push('')

    lines.push(`Preprocessor defines (${result.preprocessorDefines.length}):`)
    for (const d of result.preprocessorDefines) {
      lines.push(`  &${d.name}${d.value ? ` = ${d.value}` : ''}`)
    }
    lines.push('')

    lines.push(`Preprocessor refs (${result.preprocessorRefs.length}):`)
    for (const r of result.preprocessorRefs) {
      lines.push(`  {&${r.name}}`)
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] }
  },
} satisfies ToolModule
