# abl-mcp-server

MCP (Model Context Protocol) server for OpenEdge ABL — pluggable tool architecture with per-project YAML configuration. Provides AI assistants with 22 tools to parse, analyze, lint, document, and scaffold ABL projects.

Built on:
- [`@breakit/abl-mcp-core`](https://github.com/breakit/abl-mcp-core) — ABL parsing, analysis, linting, data contracts
- [`@breakit/abl-mcp-generators`](https://github.com/breakit/abl-mcp-generators) — Code scaffolding with REST annotations, ProDataSets, OpenEdge class hierarchy

## Quick Start

```sh
npx github:breakit/abl-mcp-server
```

Or add to opencode config:

```json
"abl": {
  "type": "local",
  "command": ["npx", "-y", "github:breakit/abl-mcp-server"],
  "enabled": true
}
```

## Pluggable Architecture

Each tool is a separate module in `src/tools/`. Tools are auto-discovered at startup and can be enabled/disabled via a per-project YAML config file.

### Per-Project Config (`./abl-mcp-server.yaml`)

Place this in your ABL project root:

```yaml
tools:
  enabled:
    - read-abl-file
    - query-abl-symbols
    - analyze-dependencies
    - abl-lint
    - gen-business-entity
    # ... add any tools you need
  disabled:
    - gen-ablunit-test        # disable test generation
    - gen-contract-typescript # disable TS type generation
```

All tools are enabled by default. Add names to `disabled` to turn them off, or set `enabled` to a specific subset.

### Adding Custom Tools

Drop a `.ts` file into `~/.config/abl-mcp-server/tools/`:

```typescript
import type { ToolModule } from '@breakit/abl-mcp-server/types'

export default {
  name: 'my-custom-tool',
  description: 'Does something custom',
  inputSchema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] },
  handler: async ({ input }) => {
    return { content: [{ type: 'text', text: `Got: ${input}` }] }
  },
} satisfies ToolModule
```

Add `my-custom-tool` to your `abl-mcp-server.yaml` enabled list.

## Tools (22 total)

### Analytical

| Tool | Description |
|---|---|
| `read-abl-file` | Parse an ABL file — list functions, includes, preprocessor defines |
| `query-abl-symbols` | List all function symbols in a file |
| `read-df-file` | Parse a `.df` schema — tables, fields, indexes, sequences |
| `resolve-includes` | Resolve `{include}` paths against the project PROPATH |
| `list-project-files` | List all `.p`/`.w`/`.cls`/`.i` files in a project |
| `check-project-config` | Read `abl.toml` config |
| `analyze-dependencies` | Build a full dependency graph — includes, calls, cycles, orphans |
| `df-diff` | Compare two `.df` schema files — structured diff |
| `find-dead-code` | Find unused functions, includes, and preprocessor defines |
| `abl-lint` | Lint ABL files for coding conventions |

### Generative

| Tool | Description |
|---|---|
| `gen-business-entity` | Generate BE `.cls`, Service, and Controller with ProDataSets and REST annotations |
| `gen-workflow` | Generate a workflow `.cls` with Execute + step methods, ProDataSet context, and REST annotations |
| `gen-business-task` | Generate a standalone Business Task `.cls` with ProDataSet input/output and Execute method |
| `gen-ccs-layer` | Generate the full CCS stack (BE + Service + Controller) |
| `gen-abldoc` | Generate HTML documentation from ABLDoc comments |
| `gen-openapi` | Generate OpenAPI 3.0 spec from `@openapi.openedge.export` annotations |
| `gen-ablunit-test` | Generate ABLUnit test class extending `TestCase` with ProDataSet CRUD tests |
| `init-project` | Scaffold a new ABL project with directory structure and `abl.toml` |

### Data Contracts

| Tool | Description |
|---|---|
| `gen-contract-tt` | Generate temp-table include (`.i`) from schema fields |
| `gen-contract-ds` | Generate ProDataSet include (`.i`) wrapping the temp-table |
| `gen-contract-json-schema` | Generate JSON Schema from table/field definition |
| `gen-contract-typescript` | Generate TypeScript interface from table/field definition |

## Architecture

```
abl-mcp-server
├── config.yaml                # Per-project tool enable/disable config
├── src/
│   ├── index.ts               # Bootstrap: auto-discovers tools, registers MCP handlers
│   ├── config-loader.ts       # Load + parse per-project YAML config
│   ├── types.ts               # ToolModule interface + config types
│   └── tools/                 # 22 pluggable tool modules (auto-discovered)
│       ├── read-abl-file.ts
│       ├── analyze-dependencies.ts
│       ├── abl-lint.ts
│       ├── gen-business-entity.ts
│       ├── gen-workflow.ts
│       ├── gen-business-task.ts
│       ├── gen-contract-ts.ts
│       └── ...
├── abl-mcp-core               # Pure analysis layer
│   └── analysis/ linting/ contracts/ utilities/
└── abl-mcp-generators          # Scaffolding templates
    └── BE, Service, Controller, Workflow, Test, ABLDoc
```

## Running

```sh
# Development
npm run build
node dist/index.js

# As MCP server (stdio)
npm start
```

## License

MIT
