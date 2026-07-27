import type { ToolModule, ToolResponse } from './types.js'
import { describe, it, expect } from 'vitest'

// Import each tool and test its handler produces valid MCP output format
import readAblFile from './tools/read-abl-file.js'
import queryAblSymbols from './tools/query-abl-symbols.js'
import readDfFile from './tools/read-df-file.js'
import resolveIncludes from './tools/resolve-includes.js'
import listProjectFiles from './tools/list-project-files.js'
import checkProjectConfig from './tools/check-project-config.js'
import analyzeDependencies from './tools/analyze-dependencies.js'
import dfDiff from './tools/df-diff.js'
import findDeadCode from './tools/find-dead-code.js'
import findAnnotations from './tools/find-annotations.js'
import ablLint from './tools/abl-lint.js'
import genDocComment from './tools/gen-doc-comment.js'
import genAbldoc from './tools/gen-abldoc.js'
import genAblunitTest from './tools/gen-ablunit-test.js'
import genOpenapi from './tools/gen-openapi.js'

function isValidMCPResponse(result: ToolResponse) {
  expect(result).toBeDefined()
  expect(Array.isArray(result.content)).toBe(true)
  expect(result.content.length).toBeGreaterThan(0)
  const first = result.content[0]
  expect(first.type).toBe('text')
  if (first.type !== 'text') {
    throw new Error(`Expected first content block to be text, got ${first.type}`)
  }
  expect(typeof first.text).toBe('string')
}

const tools: ToolModule[] = [
  readAblFile, queryAblSymbols, readDfFile, resolveIncludes, listProjectFiles,
  checkProjectConfig, analyzeDependencies, dfDiff, findDeadCode, findAnnotations,
  ablLint, genDocComment, genAbldoc, genAblunitTest, genOpenapi,
]

describe('Tool modules', () => {
  it('all tools have required fields', () => {
    for (const tool of tools) {
      expect(tool.name).toBeTruthy()
      expect(tool.description).toBeTruthy()
      expect(tool.inputSchema).toBeDefined()
      expect(tool.inputSchema.type).toBe('object')
      expect(typeof tool.handler).toBe('function')
    }
  })

  it('all tool names are unique', () => {
    const names = tools.map(t => t.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('read-abl-file', () => {
  it('returns error for missing file', async () => {
    const result = await readAblFile.handler({ filePath: '/nonexistent/ablfile.p' })
    isValidMCPResponse(result)
    expect(result.content[0].text).toContain('not found')
  })

  it('returns error when no filePath provided', async () => {
    const result = await (readAblFile as ToolModule).handler({})
    isValidMCPResponse(result)
    const first = result.content[0]
    if (first.type !== 'text') {
      throw new Error(`Expected first content block to be text, got ${first.type}`)
    }
    expect(first.text).toContain('required')
  })
})

describe('read-df-file', () => {
  it('returns error for missing file', async () => {
    const result = await readDfFile.handler({ filePath: '/nonexistent/test.df' })
    isValidMCPResponse(result)
    expect(result.content[0].text).toContain('not found')
  })
})

describe('list-project-files', () => {
  it('returns file list for existing directory', async () => {
    const result = await listProjectFiles.handler({ projectRoot: '/tmp/opencode/abl-mcp-core/src' })
    isValidMCPResponse(result)
    expect(result.content[0].text.length).toBeGreaterThan(0)
  })

  it('handles non-existent directory gracefully', async () => {
    const result = await listProjectFiles.handler({ projectRoot: '/tmp/nonexistentpath' })
    isValidMCPResponse(result)
  })
})

describe('gen-doc-comment', () => {
  it('generates doc comment block', async () => {
    const result = await genDocComment.handler({
      type: 'method',
      name: 'GetData',
      description: 'Retrieve data',
      params: [{ name: 'request', dataType: 'IGetDataRequest' }],
      returnType: 'HANDLE',
    })
    isValidMCPResponse(result)
    expect(result.content[0].text).toContain('/**')
    expect(result.content[0].text).toContain('*/')
  })

  it('requires type and name', async () => {
    const result = await genDocComment.handler({ type: 'function', name: 'MyFunc' })
    isValidMCPResponse(result)
    expect(result.content[0].text).toContain('Purpose')
  })
})

describe('find-annotations', () => {
  it('requires filePath or projectRoot', async () => {
    const result = await findAnnotations.handler({})
    isValidMCPResponse(result)
    expect(result.content[0].text).toContain('filePath')
  })

  it('finds annotations in a file', async () => {
    const result = await findAnnotations.handler({
      filePath: '/tmp/opencode/abl-mcp-core/src/analysis/annotations.ts',
    })
    isValidMCPResponse(result)
  })
})

describe('abl-lint', () => {
  it('lints a project directory', async () => {
    const result = await ablLint.handler({ projectRoot: '/tmp/opencode/abl-mcp-core/src/analysis' })
    isValidMCPResponse(result)
  })

  it('lists rules with listRules flag', async () => {
    const result = await ablLint.handler({ projectRoot: '/tmp/opencode', listRules: true })
    isValidMCPResponse(result)
    expect(result.content[0].text).toContain('rules')
  })
})
