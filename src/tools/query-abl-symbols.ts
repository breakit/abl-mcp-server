import { initAblParser, parseAblFile } from '@breakit/abl-mcp-core'
import { readFileSync } from 'fs'
import type { ToolModule } from '../types.js'

function formatParams(params: { name: string; direction: string; dataType: string | null }[]): string {
  return params.map(p => {
    const dt = p.dataType ? ` ${p.dataType}` : ''
    return `${p.direction} ${p.name}${dt}`
  }).join(', ')
}

export default {
  name: 'query-abl-symbols',
  description: 'List all symbols (class, methods, constructors, functions) defined in an ABL source file',
  inputSchema: { type: 'object', properties: { filePath: { type: 'string' } }, required: ['filePath'] },
  category: 'analytical',
  handler: async ({ filePath }: { filePath: string }) => {
    await initAblParser()
    const text = readFileSync(filePath, 'utf-8')
    const result = parseAblFile(text)

    const symbols: string[] = []

    if (result.classInfo) {
      symbols.push(`class ${result.classInfo.fullName}`)
      if (result.classInfo.inherits) symbols.push(`  extends ${result.classInfo.inherits}`)
    }

    for (const ctor of result.constructors) {
      symbols.push(`  constructor ${ctor.visibility} ${ctor.name}(${formatParams(ctor.parameters)})`)
    }

    for (const m of result.methods) {
      const ret = m.returnType.toLowerCase() !== 'void' ? ` -> ${m.returnType}` : ''
      symbols.push(`  method ${m.visibility} ${m.name}(${formatParams(m.parameters)})${ret}`)
    }

    for (const f of result.functions) {
      symbols.push(`  function ${f.name}(${formatParams(f.parameters)})`)
    }

    return { content: [{ type: 'text', text: symbols.length ? symbols.join('\n') : 'No symbols found.' }] }
  },
} satisfies ToolModule
