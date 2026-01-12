# Plan 007: Simplified Agent Interface - Architecture

## Changes Overview

| Component | Type | Description |
|-----------|------|-------------|
| OpenCode Tool Template | Modified | Reduced from 5 tools to 3; tools accept inline code |
| `CreateArtifactUseCase` | Modified | Accept code string instead of file path |
| `UpdateArtifactUseCase` | Modified | Accept code string along with artifact ID |
| `PreviewArtifactUseCase` | Modified | Start server if stopped before opening |
| CLI Commands | Modified | Add `--code` flag for inline code input |
| Domain Entities | Modified | `sourceFile` becomes optional; add `sourceCode` |

## New Tool Interface

The OpenCode tool template (`~/.config/opencode/tool/artifact-cli.ts`) will expose exactly 3 tools:

```typescript
// Tool 1: Create artifact
export const create = tool({
  description: `Create a new artifact preview from React component code.

Creates an isolated preview environment using Sandpack.
The CLI manages file storage and server lifecycle internally.

Returns:
- Artifact ID for future updates
- Preview URL 
- Instructions for stopping the server when done`,
  args: {
    code: tool.schema.string().describe("The React component code (TSX/JSX string)"),
    name: tool.schema.string().optional().describe("Optional component name (auto-detected if omitted)"),
  },
  async execute(args) {
    // Passes code via stdin or base64-encoded argument
    const result = await Bun.$`artifact create --code ${btoa(args.code)} ${args.name ? `--name ${args.name}` : ''}`.text()
    return result.trim()
  },
})

// Tool 2: Update artifact
export const update = tool({
  description: `Update an existing artifact with new code.

Writes new code and triggers hot reload.
Server is restarted automatically if it was stopped.`,
  args: {
    id: tool.schema.string().describe("Artifact ID to update"),
    code: tool.schema.string().describe("The updated React component code"),
  },
  async execute(args) {
    const result = await Bun.$`artifact update ${args.id} --code ${btoa(args.code)}`.text()
    return result.trim()
  },
})

// Tool 3: Open artifact
export const open = tool({
  description: `Open an artifact preview in the browser.

Handles all edge cases:
- If artifact exists and running: opens browser
- If artifact exists but stopped: restarts server, then opens
- If artifact not found: returns helpful error message`,
  args: {
    id: tool.schema.string().describe("Artifact ID to open"),
  },
  async execute(args) {
    const result = await Bun.$`artifact open ${args.id}`.text()
    return result.trim()
  },
})
```

## Modified Components

### CLI Layer Changes

#### `artifact create` command

**Current signature**: `artifact create <file>`  
**New signature**: `artifact create [file] [--code <base64>] [--name <name>]`

```typescript
// src/cli/commands/create.ts
cmd
  .argument('[file]', 'Path to React component file (optional if --code provided)')
  .option('--code <code>', 'Base64-encoded component code (for agent use)')
  .option('--name <name>', 'Component name (auto-detected if omitted)')
  .action(async (file: string | undefined, options: { code?: string; name?: string }) => {
    if (!file && !options.code) {
      console.error('Error: Provide either a file path or --code');
      process.exit(1);
    }
    // ...
  });
```

#### `artifact update` command

**Current signature**: `artifact update <id>`  
**New signature**: `artifact update <id> [--code <base64>]`

- If `--code` provided: uses inline code
- If `--code` omitted: re-reads from `sourceFile` (backwards compatible)

#### New `artifact open` command

**Replaces**: `artifact preview <id>`  
**New command**: `artifact open <id>`

The `open` command will:
1. Check if artifact exists → return "not found" if missing
2. Check if server running → start if stopped
3. Open browser

```typescript
// src/cli/commands/open.ts
export function openCommand(): Command {
  const cmd = new Command('open');

  cmd
    .description('Open an artifact preview in the browser')
    .argument('<id>', 'Artifact ID')
    .action(async (id: string) => {
      // 1. Find artifact
      // 2. Start server if stopped
      // 3. Open browser
      // 4. Return status
    });

  return cmd;
}
```

### Domain Layer Changes

#### `Artifact` Entity

```typescript
interface Artifact {
  id: string;
  sourceFile: string | null;      // null when created via inline code
  sourceCode: string | null;      // stored when created via inline code
  componentName: string;
  tempDir: string;
  port: number;
  url: string;
  pid: number | null;
  status: ArtifactStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `CreateArtifactUseCase`

**New input type**:

```typescript
interface CreateArtifactInput {
  // One of these must be provided
  filePath?: string;    // For CLI file-based creation
  code?: string;        // For agent inline code creation
  name?: string;        // Optional component name override
}
```

**Changes**:
1. If `code` provided, write to temp file and parse
2. Store `sourceCode` in artifact for future updates
3. Include cleanup instructions in output

**New output type**:

```typescript
interface CreateArtifactOutput {
  artifact: Artifact;
  message: string;        // Success message with ID and URL
  stopInstructions: string;  // How to stop the server
}
```

#### `UpdateArtifactUseCase`

**New input type**:

```typescript
interface UpdateArtifactInput {
  artifactId: string;
  code?: string;  // If provided, use this; else re-read sourceFile
}
```

#### `OpenArtifactUseCase` (Renamed from Preview)

Renaming `PreviewArtifactUseCase` to `OpenArtifactUseCase` for clarity.

**New behavior**:
1. Find artifact by ID
2. If not found → return `{ found: false }`
3. If found but stopped → start server
4. Open browser
5. Return `{ found: true, artifact }`

### Infrastructure Layer Changes

#### Code Storage

When inline code is provided:
1. Generate artifact ID
2. Create temp directory: `{tmpdir}/artifact-cli/artifacts/{id}/`
3. Write code to: `{tempDir}/component.tsx`
4. Parse from that file

#### Component Parser

`TypeScriptComponentParser.analyze()` already works with file paths. No changes needed if we write code to a temp file first.

## File System Layout

```
{tmpdir}/artifact-cli/
├── artifacts.json           # Artifact metadata (add sourceCode field)
└── artifacts/
    └── {id}/
        ├── component.tsx    # Source code (from file or inline)
        └── index.html       # Generated Sandpack HTML
```

## Output Format Changes

### `artifact create` Output (for agent)

```
✓ Artifact created successfully!

ID: abc123
URL: http://localhost:3001/abc123

To stop this server later:
  artifact stop abc123

To stop all servers:
  artifact stop --all
```

### `artifact update` Output (for agent)

```
✓ Artifact updated!

ID: abc123  
URL: http://localhost:3001/abc123
Status: Ready
```

### `artifact open` Output (for agent)

**If found and opened**:
```
✓ Opened artifact abc123 in browser
URL: http://localhost:3001/abc123
```

**If not found**:
```
Artifact not found: abc123
It may have been deleted or cleaned up.
```

## Backwards Compatibility

The CLI remains fully backwards compatible:
- `artifact create <file>` still works for human users
- `artifact preview <id>` continues to work (alias to `open`)
- `artifact list` and `artifact stop` remain available

Only the OpenCode tool template changes what the agent sees.

## Migration

Running `artifact opencode install` will overwrite the old tool template with the new 3-tool version.
