# Plan 009: Separate Runtime from Data - Architecture

## Changes Overview

| Component | Type | Description |
|-----------|------|-------------|
| Artifact Server | New | Standalone server module in CLI, receives artifact ID as arg |
| BunServerManager | Modified | Spawns CLI server module instead of copying code |
| Sandpack Template | Modified | Generates HTML on-the-fly at request time |
| Artifact Entity | Modified | Remove tempDir dependency for generated files |
| File Structure | Modified | Temp folder only stores component.tsx |

## New Temp Folder Structure

### Before (Current)

```
{tmpdir}/artifact-cli/
├── artifacts.json
└── artifacts/
    └── {id}/
        ├── component.tsx     # User data
        ├── index.html        # Generated (stale on upgrade)
        ├── server.ts         # Copied (stale on upgrade)
        ├── server.pid
        ├── server.log
        └── .reload
```

### After (Proposed)

```
{tmpdir}/artifact-cli/
├── artifacts.json
└── artifacts/
    └── {id}/
        ├── component.tsx     # User data (ONLY user file!)
        └── .runtime/         # Ephemeral, can be deleted
            ├── server.pid
            ├── server.log
            └── .reload
```

## New Components

### Artifact Server Module (`src/infrastructure/server/artifactServer.ts`)

A standalone server script that:
1. Receives artifact ID and port as CLI arguments
2. Reads component from temp folder
3. Generates Sandpack HTML on-the-fly
4. Serves the HTML and handles hot reload

```typescript
// src/infrastructure/server/artifactServer.ts
// This file IS the server - run with: bun run artifactServer.ts <artifactId> <port>

const artifactId = process.argv[2];
const port = parseInt(process.argv[3], 10);

// Import template generator from CLI
import { generateSandpackHtml } from '../templates/sandpackTemplate';
import { TypeScriptComponentParser } from '../services/TypeScriptComponentParser';

// ... server implementation
```

### Entry Point for Server (`src/infrastructure/server/index.ts`)

```typescript
#!/usr/bin/env bun
// Entry point for artifact server process

import { startArtifactServer } from './artifactServer';

const artifactId = process.argv[2];
const port = parseInt(process.argv[3], 10);
const artifactDir = process.argv[4];

if (!artifactId || !port || !artifactDir) {
  console.error('Usage: bun run server <artifactId> <port> <artifactDir>');
  process.exit(1);
}

startArtifactServer({ artifactId, port, artifactDir });
```

## Modified Components

### BunServerManager

**Before**: Generates server.ts content and writes to temp folder

```typescript
// OLD
const serverCode = this.generateServerScript(artifact.id, artifact.port, artifactDir, pidFile);
writeFileSync(serverScript, serverCode);
Bun.spawn(['sh', '-c', `nohup bun run "${serverScript}" > "${logFile}" 2>&1 &`]);
```

**After**: Spawns CLI's server module directly

```typescript
// NEW
import { getServerEntryPoint } from './server';

async start(artifact: Artifact): Promise<{ pid: number; port: number }> {
  const artifactDir = getArtifactDir(artifact.id);
  const runtimeDir = join(artifactDir, '.runtime');
  mkdirSync(runtimeDir, { recursive: true });
  
  const pidFile = join(runtimeDir, 'server.pid');
  const logFile = join(runtimeDir, 'server.log');
  
  // Spawn CLI's server module (not a copied script)
  const serverEntry = getServerEntryPoint(); // Returns path to CLI's server/index.ts
  
  Bun.spawn([
    'sh', '-c', 
    `nohup bun run "${serverEntry}" "${artifact.id}" "${artifact.port}" "${artifactDir}" > "${logFile}" 2>&1 &`
  ], {
    cwd: artifactDir,
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  
  // Wait for PID file...
}
```

### Artifact Server Implementation

The server generates HTML on-the-fly instead of reading from disk:

```typescript
// src/infrastructure/server/artifactServer.ts

export function startArtifactServer(config: {
  artifactId: string;
  port: number;
  artifactDir: string;
}) {
  const { artifactId, port, artifactDir } = config;
  const componentPath = join(artifactDir, 'component.tsx');
  const runtimeDir = join(artifactDir, '.runtime');
  const pidFile = join(runtimeDir, 'server.pid');
  
  // Write PID
  writeFileSync(pidFile, process.pid.toString());
  
  // SSE clients for hot reload
  const clients: Set<ReadableStreamDefaultController> = new Set();
  
  // Watch for component changes
  watch(artifactDir, (event, filename) => {
    if (filename === 'component.tsx') {
      for (const client of clients) {
        try { client.enqueue('data: reload\n\n'); } catch {}
      }
    }
  });
  
  // Also watch .runtime for .reload signal
  watch(runtimeDir, (event, filename) => {
    if (filename === '.reload') {
      for (const client of clients) {
        try { client.enqueue('data: reload\n\n'); } catch {}
      }
    }
  });
  
  const server = Bun.serve({
    port,
    idleTimeout: 0,
    async fetch(req) {
      const url = new URL(req.url);
      
      // SSE endpoint
      if (url.pathname === '/__reload') {
        return handleSSE(clients);
      }
      
      // Serve artifact
      if (url.pathname === '/' + artifactId || url.pathname === '/' + artifactId + '/') {
        // Generate HTML on-the-fly
        const parser = new TypeScriptComponentParser();
        const analysis = await parser.analyze(componentPath);
        const html = generateSandpackHtml(analysis);
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      
      // Redirect root
      if (url.pathname === '/') {
        return Response.redirect('/' + artifactId, 302);
      }
      
      return new Response('Not Found', { status: 404 });
    },
  });
  
  console.log(`Server running at http://localhost:${server.port}/${artifactId}`);
}
```

### Sandpack Template

No changes needed - it's already a pure function that generates HTML from component analysis.

### FileArtifactRepository

Update `getArtifactDir` to clarify purpose:

```typescript
export function getArtifactDir(artifactId: string): string {
  return join(ARTIFACT_CLI_DIR, 'artifacts', artifactId);
}

export function getArtifactRuntimeDir(artifactId: string): string {
  return join(getArtifactDir(artifactId), '.runtime');
}
```

## File Layout in CLI

```
src/
├── cli/
│   └── commands/
├── domain/
│   └── ...
└── infrastructure/
    ├── repositories/
    ├── services/
    │   ├── BunServerManager.ts    # Modified: spawns server module
    │   └── TypeScriptComponentParser.ts
    ├── templates/
    │   └── sandpackTemplate.ts    # Unchanged
    └── server/                    # NEW: Server module
        ├── index.ts               # Entry point for server process
        └── artifactServer.ts      # Server implementation
```

## Migration

### Existing Artifacts

Old artifacts have extra files (index.html, server.ts) that will be ignored:
- New server reads only `component.tsx`
- Old files can be cleaned up manually or left (they're harmless)

### Cleanup Command (Optional)

Add `artifact cleanup` command to remove stale files:

```bash
artifact cleanup        # Remove stale server.ts, index.html from all artifacts
artifact cleanup <id>   # Clean specific artifact
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **No stale code** | CLI upgrades immediately apply to all artifacts |
| **Less disk usage** | Only component.tsx stored per artifact |
| **Clearer separation** | User data vs CLI code is obvious |
| **Easier debugging** | Can inspect component.tsx without noise |
| **Simpler backups** | Just backup component.tsx files |

## Implementation Steps

1. Create `src/infrastructure/server/` module
2. Implement `artifactServer.ts` with on-the-fly HTML generation
3. Create `index.ts` entry point for server process
4. Modify `BunServerManager` to spawn CLI server module
5. Update `getArtifactDir` helpers
6. Test with existing artifacts (should work without migration)
7. Optional: Add cleanup command
