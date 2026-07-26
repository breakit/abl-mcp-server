# abl-mcp-server

MCP (Model Context Protocol) server for OpenEdge ABL. Provides AI assistants with tools to parse, analyze, query, and scaffold ABL projects.

Built on:
- [`@breakit/abl-mcp-core`](https://github.com/breakit/abl-mcp-core) — ABL parsing, DF reading, PROPATH resolution, symbol extraction
- [`@breakit/abl-mcp-generators`](https://github.com/breakit/abl-mcp-generators) — Code scaffolding templates

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

## Tools

### Analytical

| Tool | Description |
|---|---|
| `read-abl-file` | Parse an ABL file — list functions, includes, preprocessor defines |
| `query-abl-symbols` | List all function symbols in a file |
| `read-df-file` | Parse a `.df` schema — tables, fields, indexes, sequences |
| `resolve-includes` | Resolve `{include}` paths against the project PROPATH |
| `list-project-files` | List all `.p`/`.w`/`.cls`/`.i` files in a project |
| `check-project-config` | Read `abl.toml` config |

### Generative

| Tool | Description |
|---|---|
| `gen-business-entity` | Generate BE `.cls`, Service, and Controller for an entity (ProDataSet, REST annotations) |
| `gen-workflow` | Generate a workflow `.p` with steps and transitions |
| `gen-ccs-layer` | Generate the full CCS stack (BE + Service + Controller) |
| `gen-ablunit-test` | Generate an ABLUnit test class extending `TestCase` with ProDataSet CRUD tests |
| `init-project` | Scaffold a new ABL project with directory structure and `abl.toml` |

## Architecture

```
abl-mcp-server          # Thin MCP server (this repo)
  ├── abl-mcp-core      # Pure analysis layer
  └── abl-mcp-generators # Scaffolding templates and generators
                          #   - OpenEdge.BusinessLogic.BusinessEntity
                          #   - OpenEdge.Web.WebHandler
                          #   - OpenEdge.ABLUnit.TestCase
                          #   - REST annotations (@openapi.openedge.export)
                          #   - ProDataSet-based data exchange
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
