# Plan 010: Auto-Shutdown Idle Servers - Architecture

## Changes Overview

| Component | Type | Description |
|-----------|------|-------------|
| `artifactServer.ts` | Modified | Track client count, implement idle timer, auto-shutdown |

This is a small, focused change entirely within the artifact server module.

## Modified Components

### `src/infrastructure/server/artifactServer.ts`

**Current Behavior:**
- Tracks SSE clients in `Set<ReadableStreamDefaultController>`
- Adds clients on SSE connect, removes on disconnect
- No action when client count reaches zero

**New Behavior:**
- Same client tracking
- When client count reaches zero → start idle timer
- When client connects → cancel idle timer (if running)
- When timer expires → graceful shutdown

### Implementation

```typescript
// Configuration
const IDLE_TIMEOUT_MS = 30_000; // 30 seconds

// State
const clients: Set<ReadableStreamDefaultController> = new Set();
let idleTimer: Timer | null = null;

// Called when a client connects
function onClientConnect(controller: ReadableStreamDefaultController) {
  clients.add(controller);
  
  // Cancel any pending shutdown
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
    console.log(`[${artifactId}] Client connected, cancelled idle shutdown`);
  }
}

// Called when a client disconnects
function onClientDisconnect(controller: ReadableStreamDefaultController) {
  clients.delete(controller);
  
  console.log(`[${artifactId}] Client disconnected, ${clients.size} remaining`);
  
  // Start idle timer if no clients left
  if (clients.size === 0) {
    console.log(`[${artifactId}] No watchers, will shutdown in ${IDLE_TIMEOUT_MS / 1000}s...`);
    
    idleTimer = setTimeout(() => {
      console.log(`[${artifactId}] Idle timeout reached, shutting down...`);
      server.stop();
      process.exit(0);
    }, IDLE_TIMEOUT_MS);
  }
}

// In SSE endpoint
if (url.pathname === "/__reload") {
  const stream = new ReadableStream({
    start(controller) {
      onClientConnect(controller);
      controller.enqueue("data: connected\n\n");
    },
    cancel(controller) {
      onClientDisconnect(controller);
    },
  });
  // ...
}
```

## Server Lifecycle

```
┌─────────────────┐
│  Server Start   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Client connects
│  Waiting for    │◄────────────────────┐
│    Clients      │                     │
└────────┬────────┘                     │
         │ First client connects        │
         ▼                              │
┌─────────────────┐                     │
│    Serving      │                     │
│  (1+ clients)   │                     │
└────────┬────────┘                     │
         │ Last client disconnects      │
         ▼                              │
┌─────────────────┐                     │
│  Idle Timer     │─────────────────────┘
│   (30 seconds)  │  Client reconnects
└────────┬────────┘
         │ Timer expires (no reconnect)
         ▼
┌─────────────────┐
│    Shutdown     │
│  (process.exit) │
└─────────────────┘
```

## Edge Cases

### 1. Multiple Tabs Open
- Each tab = 1 SSE connection
- Server only shuts down when ALL tabs are closed
- Timer only starts when `clients.size === 0`

### 2. Tab Refresh
- Old connection closes (onClientDisconnect)
- Timer starts (but 30s is plenty of time)
- New connection opens (onClientConnect)
- Timer cancelled → server stays alive

### 3. Server Started, Never Viewed
- If no client ever connects, server runs indefinitely
- This is intentional: agent might create artifact without opening it
- Future enhancement: initial timeout before first connection

### 4. Rapid Open/Close
- Grace period handles this naturally
- Multiple rapid close/opens just keep resetting the timer

## Files Changed

| File | Change |
|------|--------|
| `src/infrastructure/server/artifactServer.ts` | Add idle timer logic |

## Testing

1. Create artifact, open in browser → verify SSE connection
2. Close tab → verify "No watchers" log message
3. Wait 30+ seconds → verify server shuts down
4. Run `artifact list` → verify status is "stopped"
5. Run `artifact open` → verify server restarts and preview works
6. Open artifact, refresh tab quickly → verify server stays alive
7. Open artifact in 2 tabs, close 1 → verify server stays alive
8. Close both tabs → verify shutdown after timeout
