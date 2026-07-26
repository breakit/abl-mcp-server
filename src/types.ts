export interface ToolModule {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, unknown>
    required?: string[]
  }
  handler: (args: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[] }>
  category?: 'analytical' | 'generative'
}

export interface MCPConfig {
  tools: {
    enabled: string[]
    disabled: string[]
  }
}

export interface LoadedConfig {
  allToolNames: string[]
  isEnabled(name: string): boolean
}
