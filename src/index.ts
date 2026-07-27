#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { loadConfig } from './config-loader.js'
import type { ToolModule } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function discoverTools(): Promise<ToolModule[]> {
  const config = loadConfig()
  const toolDir = join(__dirname, 'tools')
  const modules: ToolModule[] = []

  try {
    const entries = readdirSync(toolDir)
    for (const entry of entries) {
      if (!entry.endsWith('.js')) continue
      const path = join(toolDir, entry)
      const mod = await import(path)
      const tool = mod.default as ToolModule
      if (!tool || !tool.name) continue

      if (config.isEnabled(tool.name)) {
        modules.push(tool)
        console.error(`[abl-mcp-server] loaded: ${tool.name}`)
      } else {
        console.error(`[abl-mcp-server] disabled: ${tool.name}`)
      }
    }
  } catch (err) {
    console.error('[abl-mcp-server] tool discovery error:', err)
  }

  return modules
}

async function main() {
  const tools = await discoverTools()

  const server = new Server(
    { name: 'abl-mcp-server', version: '0.2.0' },
    { capabilities: { tools: {} } },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    const tool = tools.find(t => t.name === name)
    if (!tool) throw new Error(`Unknown tool: ${name}`)

    try {
      return await tool.handler(args ?? {})
    } catch (err) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        }],
      }
    }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[abl-mcp-server] running (stdio)')
}

main().catch((err) => {
  console.error('[abl-mcp-server] fatal:', err)
  process.exit(1)
})
