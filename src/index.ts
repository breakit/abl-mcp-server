#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import { initAblParser, parseAblFile } from '@breakit/abl-mcp-core'
import { parseDf, formatDfSummary } from '@breakit/abl-mcp-core'
import { loadPropath, resolveIncludePath, findProjectFiles } from '@breakit/abl-mcp-core'
import { loadConfig } from '@breakit/abl-mcp-core'
import { extractFunctions } from '@breakit/abl-mcp-core'
import { resolveIncludes } from '@breakit/abl-mcp-core'
import { scaffoldFullEntity, generateWorkflow, scaffoldCcsLayer, scaffoldProject, scaffoldTest } from '@breakit/abl-mcp-generators'

const server = new Server(
  { name: 'abl-mcp-server', version: '0.1.0' },
  { capabilities: { tools: {} } },
)

// ---------------------------------------------------------------------------
// Analytical tools (from abl-mcp-core)
// ---------------------------------------------------------------------------

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'read-abl-file',
      description: 'Parse an ABL file and return its structure (functions, includes, preprocessor defines)',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to the .p / .w / .cls / .i file' },
        },
        required: ['filePath'],
      },
    },
    {
      name: 'query-abl-symbols',
      description: 'List all function symbols defined in an ABL source file',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
        },
        required: ['filePath'],
      },
    },
    {
      name: 'read-df-file',
      description: 'Parse a .df schema file and return tables, fields, indexes, and sequences',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
        },
        required: ['filePath'],
      },
    },
    {
      name: 'resolve-includes',
      description: 'Resolve all {include} paths in an ABL file against the project PROPATH',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
          projectRoot: { type: 'string' },
        },
        required: ['filePath', 'projectRoot'],
      },
    },
    {
      name: 'list-project-files',
      description: 'List all ABL source files in a project directory',
      inputSchema: {
        type: 'object',
        properties: {
          projectRoot: { type: 'string' },
        },
        required: ['projectRoot'],
      },
    },
    {
      name: 'check-project-config',
      description: 'Read and return the project configuration from abl.toml',
      inputSchema: {
        type: 'object',
        properties: {
          projectRoot: { type: 'string' },
        },
        required: ['projectRoot'],
      },
    },
    // -----------------------------------------------------------------------
    // Generative tools (from abl-mcp-generators)
    // -----------------------------------------------------------------------
    {
      name: 'gen-business-entity',
      description: 'Generate a BE \\.cls, Service, and Controller for a business entity',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Entity name (e.g. "Customer")' },
          tableName: { type: 'string', description: 'Database table name' },
          package: { type: 'string', description: 'Package path (e.g. "com.company.module")' },
          outputDir: { type: 'string', description: 'Root output directory' },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                dataType: { type: 'string' },
                initial: { type: 'string', nullable: true },
              },
              required: ['name', 'dataType'],
            },
          },
        },
        required: ['name', 'tableName', 'package', 'outputDir'],
      },
    },
    {
      name: 'gen-workflow',
      description: 'Generate a workflow \\.p file with steps and transitions',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          initialStatus: { type: 'string', default: 'pending' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                nextStep: { type: 'string', nullable: true },
              },
              required: ['name'],
            },
          },
        },
        required: ['name', 'steps'],
      },
    },
    {
      name: 'gen-ccs-layer',
      description: 'Generate the full CCS layer stack (BE + Service + Controller)',
      inputSchema: {
        type: 'object',
        properties: {
          package: { type: 'string' },
          name: { type: 'string', description: 'Component name' },
          entityName: { type: 'string', description: 'Business entity class name' },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                dataType: { type: 'string' },
                initial: { type: 'string', nullable: true },
              },
              required: ['name', 'dataType'],
            },
          },
        },
        required: ['package', 'name', 'entityName'],
      },
    },
    {
      name: 'init-project',
      description: 'Scaffold a new ABL project with directory structure, abl.toml, and starter files',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          package: { type: 'string' },
          description: { type: 'string', nullable: true },
          outputDir: { type: 'string' },
        },
        required: ['name', 'package', 'outputDir'],
      },
    },
    {
      name: 'gen-ablunit-test',
      description: 'Generate an ABLUnit test class extending TestCase with ProDataSet-driven CRUD tests',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Entity name (e.g. "Customer")' },
          entityName: { type: 'string', description: 'Business entity class name' },
          tableName: { type: 'string' },
          package: { type: 'string' },
          outputDir: { type: 'string' },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                dataType: { type: 'string' },
                initial: { type: 'string', nullable: true },
              },
              required: ['name', 'dataType'],
            },
          },
        },
        required: ['name', 'entityName', 'tableName', 'package', 'outputDir'],
      },
    },
  ],
}))

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      // -----------------------------------------------------------------------
      // Analytical tools
      // -----------------------------------------------------------------------
      case 'read-abl-file': {
        const { filePath } = args as { filePath: string }
        await initAblParser()
        const { readFileSync } = await import('fs')
        const text = readFileSync(filePath, 'utf-8')
        const result = parseAblFile(text)
        return {
          content: [{
            type: 'text',
            text: [
              `Functions (${result.functions.length}):`,
              ...result.functions.map(f =>
                `  ${f.signature} (line ${f.startLine + 1}–${f.endLine + 1})`,
              ),
              '',
              `Includes (${result.includes.length}):`,
              ...result.includes.map(i => `  ${i.path} (line ${i.line + 1})`),
              '',
              `Preprocessor defines (${result.preprocessorDefines.length}):`,
              ...result.preprocessorDefines.map(d =>
                `  &${d.name}${d.value ? ` = ${d.value}` : ''}`,
              ),
              '',
              `Preprocessor refs (${result.preprocessorRefs.length}):`,
              ...result.preprocessorRefs.map(r => `  {&${r.name}}`),
            ].join('\n'),
          }],
        }
      }

      case 'query-abl-symbols': {
        const { filePath } = args as { filePath: string }
        await initAblParser()
        const { readFileSync } = await import('fs')
        const text = readFileSync(filePath, 'utf-8')
        const functions = extractFunctions(text, filePath)
        return {
          content: [{
            type: 'text',
            text: functions.length
              ? functions.map(f => `${f.signature}`).join('\n')
              : 'No functions found.',
          }],
        }
      }

      case 'read-df-file': {
        const { filePath } = args as { filePath: string }
        const { readFileSync } = await import('fs')
        const text = readFileSync(filePath, 'utf-8')
        const tables = parseDf(text)
        return {
          content: [{
            type: 'text',
            text: formatDfSummary(tables),
          }],
        }
      }

      case 'resolve-includes': {
        const { filePath, projectRoot } = args as { filePath: string; projectRoot: string }
        const { readFileSync } = await import('fs')
        const text = readFileSync(filePath, 'utf-8')
        const propath = loadPropath(projectRoot)
        const resolved = resolveIncludes(text, filePath, propath)
        return {
          content: [{
            type: 'text',
            text: resolved.includes.map(i =>
              `  ${i.rawPath} → ${i.resolvedPath || 'NOT FOUND'}${i.resolvedPath ? '' : ' ⚠'}`,
            ).join('\n') || 'No includes found.',
          }],
        }
      }

      case 'list-project-files': {
        const { projectRoot } = args as { projectRoot: string }
        const files = findProjectFiles(projectRoot)
        return {
          content: [{
            type: 'text',
            text: files.length
              ? files.join('\n')
              : 'No ABL source files found.',
          }],
        }
      }

      case 'check-project-config': {
        const { projectRoot } = args as { projectRoot: string }
        const config = loadConfig(projectRoot)
        return {
          content: [{
            type: 'text',
            text: [
              `Project root: ${config.projectRoot}`,
              `Schema dirs: ${config.schemaDirs.join(', ') || 'none'}`,
              `PROPATH: ${config.propath.join(', ') || 'none'}`,
              `Databases: ${Object.keys(config.databases).join(', ') || 'none'}`,
            ].join('\n'),
          }],
        }
      }

      // -----------------------------------------------------------------------
      // Generative tools
      // -----------------------------------------------------------------------
      case 'gen-business-entity': {
        const a = args as {
          name: string
          tableName: string
          package: string
          outputDir: string
          fields?: { name: string; dataType: string; initial?: string }[]
        }
        const files = scaffoldFullEntity({
          entityName: a.name,
          package: a.package,
          tableName: a.tableName,
          fields: (a.fields || []).map(f => ({ name: f.name, dataType: f.dataType, initial: f.initial })),
          outputDir: a.outputDir,
        })
        return {
          content: [{
            type: 'text',
            text: files.map(f => `📄 ${f.file}\n${f.content}`).join('\n---\n'),
          }],
        }
      }

      case 'gen-workflow': {
        const a = args as {
          name: string
          description?: string
          initialStatus?: string
          steps: { name: string; nextStep?: string }[]
        }
        const content = generateWorkflow({
          name: a.name,
          description: a.description,
          initialStatus: a.initialStatus || 'pending',
          steps: a.steps,
        })
        return {
          content: [{ type: 'text', text: content }],
        }
      }

      case 'gen-ccs-layer': {
        const a = args as {
          package: string
          name: string
          entityName: string
          fields?: { name: string; dataType: string; initial?: string }[]
        }
        const result = scaffoldCcsLayer({
          package: a.package,
          name: a.name,
          entityName: a.entityName,
          fields: (a.fields || []).map(f => ({ name: f.name, dataType: f.dataType, initial: f.initial })),
        })
        return {
          content: [{
            type: 'text',
            text: result.files.map(f => `📄 ${f.file}\n${f.content}`).join('\n---\n'),
          }],
        }
      }

      case 'init-project': {
        const a = args as {
          name: string
          package: string
          description?: string
          outputDir: string
        }
        const files = scaffoldProject({
          name: a.name,
          package: a.package,
          description: a.description,
          outputDir: a.outputDir,
        })
        return {
          content: [{
            type: 'text',
            text: files.map(f => `📄 ${f.path}\n${f.content}`).join('\n---\n'),
          }],
        }
      }

      case 'gen-ablunit-test': {
        const a = args as {
          name: string
          entityName: string
          tableName: string
          package: string
          outputDir: string
          fields?: { name: string; dataType: string; initial?: string }[]
        }
        const result = scaffoldTest({
          name: a.name,
          entityName: a.entityName,
          tableName: a.tableName,
          package: a.package,
          fields: (a.fields || []).map(f => ({ name: f.name, dataType: f.dataType, initial: f.initial })),
          outputDir: a.outputDir,
        })
        return {
          content: [{
            type: 'text',
            text: `📄 ${result.file}\n${result.content}`,
          }],
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${err instanceof Error ? err.message : String(err)}`,
      }],
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('ABL MCP server running on stdio')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
