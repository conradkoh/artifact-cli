# Plan 006: Server Lifecycle Improvements - Architecture

## Changes Overview

| Component | Type | Description |
|-----------|------|-------------|
| `BunServerManager` | Modified | Remove auto-timeout logic |
| `sandpackTemplate` | Modified | Remove heartbeat mechanism |
| `list` command | New | List all artifacts with status |
| `stop` command | New | Stop servers by ID or all |
| `opencode` command | Modified | Enhanced tool descriptions, add list/stop tools |

## Component Changes

### 1. BunServerManager (`src/infrastructure/services/BunServerManager.ts`)

**Remove:**
- `TIMEOUT_SECONDS` constant
- `lastActivity` tracking
- `setInterval` for timeout check
- `/__heartbeat` endpoint

**Keep:**
- All other functionality (start, stop, reload, isRunning)
- SSE for hot reload

### 2. Sandpack Template (`src/infrastructure/templates/sandpackTemplate.ts`)

**Remove:**
- Heartbeat `setInterval` (every 30s)
- Initial heartbeat fetch

### 3. List Command (`src/cli/commands/list.ts`)

```typescript
export function listCommand(): Command {
  // Get all artifacts from repository
  // Check running status for each
  // Display formatted table
}
```

### 4. Stop Command (`src/cli/commands/stop.ts`)

```typescript
export function stopCommand(): Command {
  // Accepts <id> or --all flag
  // Stops server(s) via ServerManager
  // Updates artifact status in repository
}
```

### 5. OpenCode Tool Template

Enhanced descriptions for all tools:

```typescript
export const create = tool({
  description: `Create an artifact preview from a React component using Sandpack.

How it works:
- Parses your component and detects npm dependencies automatically
- Creates a Sandpack environment with hot reload support
- Starts a local server that runs until stopped with 'artifact stop <id>'

Requirements:
- File path can be relative or absolute
- Must be a React component file (.tsx/.jsx)
- Local TypeScript errors are OK - Sandpack handles compilation

Returns artifact ID and preview URL.`,
  // ...
})

export const list = tool({
  description: "List all artifacts and their server status (running/stopped)",
  // ...
})

export const stop = tool({
  description: "Stop an artifact server. Use --all to stop all servers.",
  // ...
})
```

## Implementation Order

1. Remove auto-timeout from `BunServerManager.ts`
2. Remove heartbeat from `sandpackTemplate.ts`
3. Create `list` command
4. Create `stop` command
5. Update `opencode` command with enhanced descriptions and new tools
6. Register new commands in CLI index
