# Plan 008: Agent Tool Fixes - Architecture

## Changes Overview

| Component | Type | Description |
|-----------|------|-------------|
| OpenCode Tool Template | Modified | Use `Buffer` instead of `btoa` for encoding |
| CLI create command | Modified | Use `Buffer` instead of `atob` for decoding |
| CLI update command | Modified | Use `Buffer` instead of `atob` for decoding |
| BunServerManager | Modified | Add `idleTimeout: 0` to server config |
| Sandpack Template | Modified | Add debug logging for SSE events |

## Bug Fix 1: UTF-8 Encoding

### Problem

```javascript
// This fails on Unicode characters
const encoded = btoa("🔥 Fire emoji");
// Throws: InvalidCharacterError: The string contains invalid characters.
```

### Solution

**OpenCode Tool Template (`~/.config/opencode/tool/artifact-cli.ts`)**:

```typescript
// Before (broken)
const encoded = btoa(args.code)

// After (fixed)
const encoded = Buffer.from(args.code).toString('base64')
```

**CLI Commands (`src/cli/commands/create.ts`, `update.ts`)**:

```typescript
// Before (broken)
code = atob(options.code);

// After (fixed)
code = Buffer.from(options.code, 'base64').toString('utf-8');
```

### Files Modified

| File | Change |
|------|--------|
| `src/cli/commands/opencode.ts` | Tool template uses `Buffer.from().toString('base64')` |
| `src/cli/commands/create.ts` | Decode with `Buffer.from(code, 'base64').toString('utf-8')` |
| `src/cli/commands/update.ts` | Decode with `Buffer.from(code, 'base64').toString('utf-8')` |

## Bug Fix 2: SSE Connection Timeout

### Problem

```typescript
// Bun.serve default behavior
const server = Bun.serve({
  port: 3000,
  // idleTimeout defaults to 10 seconds
  fetch(req) { /* ... */ }
});
// SSE connections are closed after 10 seconds of "inactivity"
```

### Solution

**BunServerManager (`src/infrastructure/services/BunServerManager.ts`)**:

```typescript
const server = Bun.serve({
  port: ${port},
  idleTimeout: 0, // Disable timeout for SSE connections
  async fetch(req) {
    // ...
  }
});
```

### Files Modified

| File | Change |
|------|--------|
| `src/infrastructure/services/BunServerManager.ts` | Add `idleTimeout: 0` to server config |

## Enhancement: Debug Logging

### Change

**Sandpack Template (`src/infrastructure/templates/sandpackTemplate.ts`)**:

```javascript
// Before
const evtSource = new EventSource('/__reload');
evtSource.onmessage = (event) => {
  if (event.data === 'reload') {
    window.location.reload();
  }
};

// After
const evtSource = new EventSource('/__reload');
evtSource.onopen = () => {
  console.log('[artifact-cli] Hot reload connected');
};
evtSource.onerror = (e) => {
  console.error('[artifact-cli] Hot reload connection error', e);
};
evtSource.onmessage = (event) => {
  console.log('[artifact-cli] Received:', event.data);
  if (event.data === 'reload') {
    console.log('[artifact-cli] Reloading page...');
    window.location.reload();
  }
};
```

### Files Modified

| File | Change |
|------|--------|
| `src/infrastructure/templates/sandpackTemplate.ts` | Add SSE debug logging |

## Testing

### UTF-8 Encoding Test

```bash
# Create artifact with emoji
bun -e "
const code = 'export default () => <div>🔥🔥🔥</div>';
const encoded = Buffer.from(code).toString('base64');
console.log(encoded);
" | xargs -I {} bun run index.ts create --code {}

# Verify emoji in component file
cat /tmp/artifact-cli/artifacts/<id>/component.tsx
# Should show: export default () => <div>🔥🔥🔥</div>
```

### Hot Reload Timeout Test

```bash
# Create artifact
bun run index.ts create --code $(echo "export default () => <div>v1</div>" | base64)

# Open in browser, wait 15+ seconds

# Update artifact
bun run index.ts update <id> --code $(echo "export default () => <div>v2</div>" | base64)

# Page should auto-reload to show "v2"
```

## Backwards Compatibility

All changes are backwards compatible:

- `Buffer` API is available in both Node.js and Bun
- `idleTimeout: 0` is a valid Bun.serve option
- Debug logging doesn't affect functionality
- Tool signatures unchanged
