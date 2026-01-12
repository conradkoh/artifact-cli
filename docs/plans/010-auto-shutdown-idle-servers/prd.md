# Plan 010: Auto-Shutdown Idle Servers - PRD

## Glossary

| Term | Definition |
|------|------------|
| **Watcher** | A browser tab with an active SSE connection to the artifact server |
| **Idle Timeout** | Duration to wait after last watcher disconnects before shutting down |
| **Grace Period** | Same as idle timeout; time given for potential reconnection |
| **Client Count** | Number of active SSE connections (watchers) |

## User Stories

### US-1: Automatic Resource Cleanup

**As a** developer running multiple artifacts,  
**I want** idle servers to shut down automatically,  
**So that** my system resources aren't wasted on previews I'm not looking at.

**Acceptance Criteria**:
- Server shuts down ~30 seconds after the last browser tab is closed
- No manual intervention required
- Running `artifact list` shows the server as "stopped"

### US-2: Seamless Restart

**As a** developer returning to an artifact,  
**I want** `artifact open` to start the server if it was auto-stopped,  
**So that** I don't notice or care that it was shut down.

**Acceptance Criteria**:
- `artifact open <id>` works whether server is running or stopped
- No error messages about auto-shutdown
- Preview loads normally after restart

### US-3: Grace Period for Tab Refresh

**As a** developer refreshing my browser,  
**I want** a grace period before shutdown,  
**So that** a quick refresh doesn't kill the server.

**Acceptance Criteria**:
- Refreshing a tab doesn't trigger shutdown (reconnects within grace period)
- Closing tab and quickly reopening keeps server alive
- Default grace period is reasonable (30 seconds)

### US-4: Shutdown Logging

**As a** developer debugging server issues,  
**I want** to see when and why a server shut down,  
**So that** I can understand the server lifecycle.

**Acceptance Criteria**:
- Server logs message before shutdown: "No watchers for 30s, shutting down..."
- Log includes artifact ID and timestamp
- Log is written to server.log in .runtime folder

## Configuration Options

### Environment Variable (Optional Future Enhancement)

```bash
# Set idle timeout in seconds (0 = never auto-shutdown)
ARTIFACT_IDLE_TIMEOUT=30
```

For initial implementation, we'll use a hardcoded default of 30 seconds.
