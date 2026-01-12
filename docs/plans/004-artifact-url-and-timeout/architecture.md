# Plan 004: Artifact URL and Auto-Timeout - Architecture

## Changes Overview

| Component | Type | Description |
|-----------|------|-------------|
| Server Script | Modified | Add artifact ID routing, heartbeat endpoint, auto-timeout |
| Sandpack Template | Modified | Add heartbeat mechanism, update URL display |
| BunServerManager | Modified | Update URL generation, handle restart logic |
| UpdateArtifact Use Case | Modified | Auto-restart server if stopped |
| CreateArtifact Use Case | Modified | Use random port selection |

## URL Structure

**Before:**
```
http://localhost:3001
```

**After:**
```
http://localhost:<random-port>/<artifact-id>
```

Example:
```
http://localhost:3847/a1b2c3
```

## Server Changes

### Route Handling

```typescript
// Server handles these routes:
GET /<artifact-id>           → Serve index.html
GET /<artifact-id>/          → Serve index.html
GET /__heartbeat             → Reset timeout, return 200
GET /__reload                → SSE endpoint for hot reload
GET /*                       → 404 for invalid paths
```

### Auto-Timeout Implementation

```typescript
// In server.ts
let lastActivity = Date.now();
const TIMEOUT_MS = 60_000; // 1 minute

// Heartbeat endpoint
if (url.pathname === '/__heartbeat') {
  lastActivity = Date.now();
  return new Response('ok');
}

// Timeout check interval
setInterval(() => {
  if (Date.now() - lastActivity > TIMEOUT_MS) {
    console.log('Server timed out, shutting down...');
    process.exit(0);
  }
}, 10_000); // Check every 10 seconds
```

### Heartbeat from Browser

```javascript
// In sandpackTemplate.ts - browser sends heartbeat every 30s
setInterval(() => {
  fetch('/__heartbeat').catch(() => {});
}, 30_000);
```

## Artifact Entity Changes

No schema changes needed - `port` and `url` fields already exist.

**URL Format Update:**
```typescript
// Before
url: `http://localhost:${port}`

// After  
url: `http://localhost:${port}/${id}`
```

## Use Case Changes

### CreateArtifact

```typescript
// Use truly random available port instead of sequential
const port = await findRandomAvailablePort();

// URL now includes artifact ID
const url = `http://localhost:${port}/${id}`;
```

### UpdateArtifact

```typescript
// Check if server is running
const isRunning = await this.serverManager.isRunning(artifact);

if (!isRunning) {
  // Restart the server
  const { pid, port } = await this.serverManager.start(artifact);
  artifact.pid = pid;
  artifact.status = 'running';
  // Note: Try to reuse same port, update if not available
}

// Continue with update...
```

## Port Management

### Random Port Selection

```typescript
async function findRandomAvailablePort(): Promise<number> {
  // Use port 0 to let OS assign random available port
  const server = Bun.serve({
    port: 0,
    fetch() { return new Response(''); }
  });
  const port = server.port;
  server.stop();
  return port;
}
```

### Port Reuse on Restart

When restarting a stopped artifact:
1. Try to bind to the stored port
2. If port is taken, find a new random port
3. Update artifact metadata with new port/URL if changed

## File System Structure

```
$TMPDIR/artifact-cli/
├── artifacts.json              # Artifact metadata
└── artifacts/
    ├── a1b2c3/                 # Artifact ID as folder name
    │   ├── index.html
    │   ├── server.ts
    │   ├── server.pid
    │   └── server.log
    └── d4e5f6/
        └── ...
```

## Sequence Diagrams

### Create Flow

```
User                CLI                 Server
  |                  |                    |
  |-- create file -->|                    |
  |                  |-- find port ------>|
  |                  |-- generate files ->|
  |                  |-- start server --->|
  |                  |                    |-- listening on /<id>
  |<-- URL with ID --|                    |
```

### Update with Auto-Restart

```
User                CLI                 Server
  |                  |                    |
  |-- update id ---->|                    |
  |                  |-- check running -->| (not running)
  |                  |-- restart server ->|
  |                  |                    |-- listening
  |                  |-- update files --->|
  |                  |-- trigger reload ->|
  |<-- success ------|                    |
```

### Auto-Timeout Flow

```
Browser             Server
  |                   |
  |-- heartbeat ----->| (reset timer)
  |                   |
  |    ... 30s ...    |
  |                   |
  |-- heartbeat ----->| (reset timer)
  |                   |
  |  (browser closed) |
  |                   |
  |    ... 60s ...    |
  |                   |-- timeout reached
  |                   |-- process.exit(0)
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| Invalid artifact ID in URL | Return 404 HTML page |
| Port no longer available | Find new port, update metadata |
| Server crashed | Detect via isRunning, restart on update |
| Heartbeat fails | Browser shows warning (optional) |
