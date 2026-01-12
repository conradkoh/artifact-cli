# Plan 001: Foundation - Architecture

## Changes Overview

This plan establishes the initial architecture with the following components:

| Component | Type | Description |
|-----------|------|-------------|
| CLI Layer | New | Command parsing using Bun-compatible argument handling |
| Use Cases | New | CreateArtifact, UpdateArtifact, PreviewArtifact orchestrators |
| Domain Entities | New | Artifact, ComponentAnalysis |
| TypeScript Parser | New | AST-based component analysis using TS compiler API |
| Server Manager | New | Bun-based HTTP server for Sandpack previews |
| Artifact Repository | New | File-based JSON storage in temp directory |
| Sandpack Template | New | HTML/JS template for preview application |

## New Components

### CLI Layer

#### Entry Point (`src/cli/index.ts`)

```typescript
// Parses CLI arguments and routes to appropriate command handler
// Uses Bun.argv for argument parsing (no external dependency needed initially)

Commands:
  artifact create <file>     Create a new artifact from a React component
  artifact update <id>       Update an existing artifact
  artifact preview <id>      Open artifact in browser
```

#### Command Handlers

Each command handler:
1. Validates input arguments
2. Instantiates required dependencies
3. Calls the appropriate use case
4. Formats and outputs the result

### Application Layer

#### CreateArtifact Use Case

```
Input: { filePath: string }

Flow:
1. Resolve absolute path from filePath
2. Call ComponentParser.analyze(filePath)
3. Generate unique artifact ID
4. Create temp directory for artifact files
5. Generate Sandpack configuration files
6. Start preview server via ServerManager
7. Save artifact via ArtifactRepository
8. Return artifact with URL

Output: { artifact: Artifact }
```

#### UpdateArtifact Use Case

```
Input: { artifactId: string, filePath?: string }

Flow:
1. Load existing artifact via ArtifactRepository
2. Re-analyze component file
3. Regenerate Sandpack configuration
4. Trigger hot reload via ServerManager
5. Update artifact metadata
6. Save artifact via ArtifactRepository

Output: { artifact: Artifact }
```

#### PreviewArtifact Use Case

```
Input: { artifactId: string }

Flow:
1. Load artifact via ArtifactRepository
2. Verify server is running
3. Execute system 'open' command with artifact URL

Output: { success: boolean }
```

### Infrastructure Layer

#### TypeScriptComponentParser

Uses the TypeScript Compiler API to:

1. **Parse the source file** into an AST
2. **Extract imports**:
   - Identify npm package imports (for Sandpack dependencies)
   - Identify local file imports (to bundle inline)
3. **Find exports**:
   - Detect default export or named exports
   - Identify the primary React component
4. **Resolve local imports recursively**:
   - Read imported file contents
   - Parse their imports (up to 2 levels deep)

```typescript
// Pseudocode
async analyze(filePath: string): Promise<ComponentAnalysis> {
  const sourceFile = ts.createSourceFile(...)
  
  const imports = extractImports(sourceFile)
  const npmDeps = imports.filter(isNpmPackage)
  const localImports = await resolveLocalImports(imports.filter(isRelative))
  const componentName = findPrimaryExport(sourceFile)
  
  return {
    componentName,
    code: fs.readFileSync(filePath, 'utf-8'),
    dependencies: npmDeps,
    localImports
  }
}
```

#### BunServerManager

Manages preview server lifecycle using Bun's native HTTP server:

```typescript
// Each artifact gets its own server process for isolation
// Server serves the generated Sandpack HTML application
// Uses Bun.spawn() to run server in background (detached)

async start(artifact: Artifact): Promise<{ pid: number; port: number }> {
  const port = await findAvailablePort()
  const serverScript = generateServerScript(artifact)
  
  const proc = Bun.spawn(['bun', 'run', serverScript], {
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore']
  })
  
  return { pid: proc.pid, port }
}
```

#### FileArtifactRepository

Stores artifact metadata as JSON in the temp directory:

```
$TMPDIR/artifact-cli/
├── artifacts.json          # Array of all artifact metadata
└── artifacts/
    ├── a1b2c3/             # Artifact-specific directory
    │   ├── index.html      # Sandpack preview app
    │   ├── App.tsx         # Generated entry component
    │   └── server.ts       # Bun server script
    └── d4e5f6/
        └── ...
```

### Sandpack Template

The preview application structure:

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Artifact Preview</title>
  <script type="module" src="https://esm.sh/@codesandbox/sandpack-react"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import { Sandpack } from 'https://esm.sh/@codesandbox/sandpack-react'
    import { createRoot } from 'https://esm.sh/react-dom/client'
    
    const files = ${JSON.stringify(files)}
    const dependencies = ${JSON.stringify(dependencies)}
    
    createRoot(document.getElementById('root')).render(
      <Sandpack
        files={files}
        customSetup={{ dependencies }}
        template="react"
      />
    )
  </script>
</body>
</html>
```

## New Contracts

### Artifact Entity

```typescript
interface Artifact {
  id: string;
  sourceFile: string;
  componentName: string;
  tempDir: string;
  port: number;
  url: string;
  pid: number | null;
  status: ArtifactStatus;
  createdAt: Date;
  updatedAt: Date;
}

type ArtifactStatus = 'starting' | 'running' | 'stopped' | 'error';
```

### ComponentAnalysis Entity

```typescript
interface ComponentAnalysis {
  componentName: string;
  code: string;
  dependencies: string[];
  localImports: LocalImport[];
}

interface LocalImport {
  importPath: string;
  resolvedPath: string;
  code: string;
}
```

### Repository Interface

```typescript
interface ArtifactRepository {
  save(artifact: Artifact): Promise<void>;
  findById(id: string): Promise<Artifact | null>;
  findAll(): Promise<Artifact[]>;
  findBySourceFile(sourceFile: string): Promise<Artifact | null>;
  delete(id: string): Promise<void>;
}
```

### Service Interfaces

```typescript
interface ComponentParser {
  analyze(filePath: string): Promise<ComponentAnalysis>;
}

interface ServerManager {
  start(artifact: Artifact): Promise<{ pid: number; port: number }>;
  stop(artifact: Artifact): Promise<void>;
  reload(artifact: Artifact): Promise<void>;
  isRunning(artifact: Artifact): Promise<boolean>;
}
```

## Port Management

- Default port range: 3001-3100
- Each artifact claims next available port
- Port stored in artifact metadata
- On artifact stop, port is released

## ID Generation

- Use `nanoid` (or simple random hex) for short unique IDs
- 6 characters provides 16M+ possibilities
- Format: lowercase alphanumeric (e.g., `a1b2c3`)

## Hot Reload Strategy

Two approaches considered:

1. **File Watching + WebSocket** (Complex)
   - Server watches temp files for changes
   - Pushes updates via WebSocket
   - Sandpack receives and re-renders
   
2. **Full Regeneration + SSE** (Simpler - Chosen)
   - CLI regenerates all Sandpack files
   - Server detects file change
   - Sends SSE event to trigger page reload
   - Simpler implementation, good enough for dev previews

## Error Handling

| Error Case | Handling |
|------------|----------|
| File not found | Exit with error message, code 1 |
| Parse error | Show TS error details, exit code 1 |
| Port unavailable | Try next port in range |
| Server crash | Update artifact status to 'error' |
| Invalid artifact ID | Exit with error message, code 1 |
