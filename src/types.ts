import type { LintRuleSpec } from '@breakit/abl-mcp-core'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export interface ToolContent {
  type: 'text'
  text: string
}

export type ToolResponse = CallToolResult

export interface ToolInputSchema {
  type: 'object'
  properties: Record<string, unknown>
  required?: string[]
}

export interface ToolModule {
  name: string
  description: string
  inputSchema: ToolInputSchema
  handler: (args: any) => Promise<ToolResponse>
  category?: 'analytical' | 'generative'
}

export type { LintRuleSpec }

export interface MCPConfig {
  tools: {
    enabled: string[]
    disabled: string[]
  }
  lint?: {
    rules?: Record<string, LintRuleSpec>
  }
}

export interface LoadedConfig {
  allToolNames: string[]
  isEnabled(name: string): boolean
  lintRules: Record<string, LintRuleSpec>
}
