import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@breakit/abl-mcp-core': resolve(__dirname, '../abl-mcp-core/src'),
      '@breakit/abl-mcp-generators': resolve(__dirname, '../abl-mcp-generators/src'),
      '@breakit/abl-mcp-contracts': resolve(__dirname, '../abl-mcp-contracts/src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
