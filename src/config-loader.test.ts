import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs'
import { resolve } from 'path'
import { loadConfig } from './config-loader.js'

const TEST_DIR = '/tmp/testablconfig'

function cleanup() {
  const yaml = resolve(TEST_DIR, 'abl-mcp-server.yaml')
  try { unlinkSync(yaml) } catch {}
}

describe('loadConfig', () => {
  beforeEach(() => {
    cleanup()
    if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(cleanup)

  it('returns default tools when no project config', () => {
    const config = loadConfig(TEST_DIR)
    expect(config.allToolNames.length).toBeGreaterThan(0)
    expect(config.isEnabled('read-abl-file')).toBe(true)
    expect(config.isEnabled('abl-lint')).toBe(true)
  })

  it('returns default lint rules from server config.yaml', () => {
    const config = loadConfig(TEST_DIR)
    expect(Object.keys(config.lintRules).length).toBeGreaterThan(30)
    expect(config.lintRules['no-undo']).toBeDefined()
    expect(config.lintRules['no-undo'].severity).toBe('error')
  })

  it('overrides tool enabled list from project config', () => {
    writeFileSync(resolve(TEST_DIR, 'abl-mcp-server.yaml'), `tools:
  enabled:
    - read-abl-file
    - abl-lint
`)

    const config = loadConfig(TEST_DIR)
    expect(config.isEnabled('read-abl-file')).toBe(true)
    expect(config.isEnabled('abl-lint')).toBe(true)
    expect(config.isEnabled('gen-abldoc')).toBe(false)
  })

  it('disables tools via disabled list', () => {
    writeFileSync(resolve(TEST_DIR, 'abl-mcp-server.yaml'), `tools:
  disabled:
    - abl-lint
`)

    const config = loadConfig(TEST_DIR)
    expect(config.isEnabled('abl-lint')).toBe(false)
    expect(config.isEnabled('read-abl-file')).toBe(true)
  })

  it('merges project lint rules with server defaults', () => {
    writeFileSync(resolve(TEST_DIR, 'abl-mcp-server.yaml'), `lint:
  rules:
    no-undo:
      severity: warning
      message: 'should have no-undo'
      pattern: 'test'
    my-rule:
      severity: error
      message: 'custom rule'
      pattern: 'test'
`)

    const config = loadConfig(TEST_DIR)
    expect(config.lintRules['no-undo'].severity).toBe('warning') // overridden
    expect(config.lintRules['my-rule']).toBeDefined()
    expect(config.lintRules['my-rule'].severity).toBe('error')
    // Other rules still present from defaults
    expect(config.lintRules['pause']).toBeDefined()
  })

  it('handles empty project config gracefully', () => {
    writeFileSync(resolve(TEST_DIR, 'abl-mcp-server.yaml'), '')

    const config = loadConfig(TEST_DIR)
    expect(config.allToolNames.length).toBeGreaterThan(0)
  })
})
