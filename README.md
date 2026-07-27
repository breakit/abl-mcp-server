# abl-mcp-server

MCP (Model Context Protocol) server for OpenEdge ABL — pluggable tool architecture with per-project YAML configuration. Provides AI assistants with 24 tools to parse, analyze, lint, document, and scaffold ABL projects.

Built on:
- [`@breakit/abl-mcp-core`](https://github.com/breakit/abl-mcp-core) — ABL parsing, analysis, linting
- [`@breakit/abl-mcp-generators`](https://github.com/breakit/abl-mcp-generators) — Code scaffolding with REST annotations, ProDataSets, OpenEdge class hierarchy
- [`@breakit/abl-mcp-contracts`](https://github.com/breakit/abl-mcp-contracts) — Data contract generators (.i, JSON Schema, TypeScript)
- [`@breakit/abl-mcp-doc`](https://github.com/breakit/abl-mcp-doc) — ABLDoc parsing, doc comment generation, HTML documentation

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
    - gen-doc-comment
    - gen-abldoc
    - gen-ablunit-test
    - abl-lint
    # ... add any tools you need
  disabled:
    - check-project-config
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

## Tools (24 total, 13 enabled by default)

All 24 tools are available but only a curated subset is enabled by default. Enable additional tools via `abl-mcp-server.yaml` (see Pluggable Architecture above).

### Default-enabled

#### Analytical

| Tool | Description |
|---|---|
| `read-abl-file` | Parse an ABL file — list functions, includes, preprocessor defines |
| `query-abl-symbols` | List all function symbols in a file |
| `read-df-file` | Parse a `.df` schema — tables, fields, indexes, sequences |
| `resolve-includes` | Resolve `{include}` paths against the project PROPATH |
| `list-project-files` | List all `.p`/`.w`/`.cls`/`.i` files in a project |
| `analyze-dependencies` | Build a full dependency graph — includes, calls, cycles, orphans |
| `df-diff` | Compare two `.df` schema files — structured diff |
| `find-dead-code` | Find unused functions, includes, and preprocessor defines |
| `find-annotations` | Find TODO, FIXME, HACK, XXX, NOTE and similar marker comments |
| `abl-lint` | Lint ABL files for coding conventions (37 rules defined in config.yaml) |

### Lint Rules

All 37 rules are defined in `config.yaml` (shipped with the server). They are inspired by [Prolint](https://github.com/jcaillon/prolint). To see all active rules: call `abl-lint` with `listRules: true`.

Customize rules via your project's `abl-mcp-server.yaml`:

```yaml
lint:
  rules:
    # Override severity of an existing rule
    no-undo:
      pattern: '^DEFINE (?:VARIABLE|VAR) +\w+ (?:AS \w+ )?(?!.*NO-UNDO)'
      message: 'DEFINE VARIABLE should include NO-UNDO'
      severity: warning

    # Add a custom rule
    my-naming-convention:
      pattern: '^\s*PROCEDURE\s+[a-z\d]'
      message: 'Procedure names should start with uppercase'
      severity: warning

    # Disable a rule by not including it in enabled (see tools.disabled pattern)
```

| Group | Rules |
|---|---|
| **No-undo / Lock** | `no-undo`, `no-undo-param` |
| **Deprecations** | `pause`, `global-define`, `recid`, `shared` |
| **Shell / Security** | `shell-call`, `hardcoded-email` |
| **Find / Performance** | `no-lock-type`, `find-no-error`, `for-each-no-where`, `exclusive-no-wait`, `no-index` |
| **Style / Convention** | `end-type`, `block-label`, `lex-colon`, `method-name-case`, `class-name-case`, `function-name-case`, `nolonglines` |
| **Strings / i18n** | `backslash-in-string`, `colon-t`, `string-concat` |
| **Potential bugs** | `dot-comment`, `return-error`, `weak-char`, `release-statement`, `public-var` (`.cls` only) |
| **Cross-platform** | `run-backslash`, `include-case`, `include-backslash` |
| **Misc** | `table-name`, `when-misuse` |
| **Naming** | `naming-tt`, `naming-ds`, `naming-var`, `naming-param` |

#### Generative

| Tool | Description |
|---|---|
| `gen-doc-comment` | Generate a formatted ABLDoc (`/** */`) comment block for classes, methods, functions, or procedures (powered by `@breakit/abl-mcp-doc`) |
| `gen-abldoc` | Generate HTML documentation from existing ABLDoc comments in a project (powered by `@breakit/abl-mcp-doc`) |
| `gen-ablunit-test` | Generate ABLUnit test class extending `TestCase` with ProDataSet CRUD tests |

### Available (disabled by default)

| Tool | Category | Description |
|---|---|---|
| `check-project-config` | Analytical | Read `abl.toml` config |
| `gen-business-entity` | Generative | Generate BE `.cls`, Service, and Controller with ProDataSets and REST annotations |
| `gen-workflow` | Generative | Generate a workflow `.cls` with Execute + step methods, ProDataSet context |
| `gen-business-task` | Generative | Generate a standalone Business Task `.cls` with ProDataSet input/output |
| `gen-ccs-layer` | Generative | Generate the full CCS stack (BE + Service + Controller) |
| `gen-openapi` | Generative | Generate OpenAPI 3.0 spec from `@openapi.openedge.export` annotations |
| `init-project` | Generative | Scaffold a new ABL project with directory structure and `abl.toml` |
| `gen-contract-tt` | Data Contract | Generate temp-table include (`.i`) from schema fields |
| `gen-contract-ds` | Data Contract | Generate ProDataSet include (`.i`) wrapping the temp-table |
| `gen-contract-json-schema` | Data Contract | Generate JSON Schema from table/field definition |
| `gen-contract-typescript` | Data Contract | Generate TypeScript interface from table/field definition |

## Architecture

```
abl-mcp-server
├── config.yaml                # Default tool enable/disable + 37 lint rules
├── src/
│   ├── index.ts               # Bootstrap: auto-discovers tools, registers MCP handlers
│   ├── config-loader.ts       # Load + parse per-project YAML config (+ project overlay)
│   ├── types.ts               # ToolModule interface + config types
│   └── tools/                 # 24 pluggable tool modules (auto-discovered)
│       ├── read-abl-file.ts
│       ├── analyze-dependencies.ts
│       ├── abl-lint.ts
│       ├── find-annotations.ts
│       ├── gen-business-entity.ts
│       ├── gen-workflow.ts
│       ├── gen-business-task.ts
│       ├── gen-doc-comment.ts
│       ├── gen-abldoc.ts
│       ├── gen-contract-*.ts
│       └── ...
├── @breakit/abl-mcp-core      # Pure analysis layer — parsers, analysis, linting
├── @breakit/abl-mcp-generators # Scaffolding templates — BE, Service, Controller, Workflow
├── @breakit/abl-mcp-contracts  # Data contract generators — .i, JSON Schema, TypeScript
└── @breakit/abl-mcp-doc        # Documentation utilities — ABLDoc parser + comment generator
```

## Installation

The server is distributed as a GitHub package (not published to npm). Install directly from the repo:

```sh
# npm
npm install github:breakit/abl-mcp-server

# pnpm
pnpm add github:breakit/abl-mcp-server

# yarn
yarn add github:breakit/abl-mcp-server
```

### One-shot usage (no install)

```sh
npx github:breakit/abl-mcp-server
```

### As an MCP server dependency

Add to your project's `package.json`:

```json
"dependencies": {
  "@breakit/abl-mcp-server": "github:breakit/abl-mcp-server"
}
```

Then import in your MCP host:

```typescript
import { createServer } from '@breakit/abl-mcp-server'
```

## Development

```sh
git clone https://github.com/breakit/abl-mcp-server.git
cd abl-mcp-server
yarn install
yarn build
yarn start
```

### Local Multi-Repo Development

If you are working on the sibling repos in `../abl-mcp-core`, `../abl-mcp-contracts`, `../abl-mcp-doc`, and `../abl-mcp-generators`, bootstrap them with Yarn and symlink them into this repo:

```sh
yarn setup:local
```

That command:

- runs `yarn install` in each sibling repo
- builds each sibling repo so their `dist/` entrypoints exist
- symlinks them into this repo's `node_modules/@breakit/`
- includes `@breakit/abl-mcp-doc` in the local sibling package graph
- links `../abl-mcp-core` into `../abl-mcp-generators/node_modules/@breakit/` for local runtime resolution

When you change sibling repo code, rerun:

```sh
yarn build:local-deps
yarn link:local-deps
```

## Acknowledgments

- Lint rules inspired by [Prolint](https://github.com/jcaillon/prolint) by Jurjen Dijkstra and contributors
- ABL parsing via [tree-sitter-abl](https://github.com/usagi-coffee/tree-sitter-abl)
- Language server concepts from [abl-language-server](https://github.com/usagi-coffee/abl-language-server)
- Naming conventions derived from Progress ABL community standards

## License

MIT
