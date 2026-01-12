# Plan 004: Artifact URL and Auto-Timeout

## Summary

Improve artifact management with:
1. **Artifact ID in URL** - Include the artifact ID in the URL path for clear identification
2. **Randomized Ports** - Each artifact gets a random available port
3. **Auto-Timeout** - Servers automatically stop after ~1 minute of inactivity
4. **Auto-Restart** - Updating a stopped artifact automatically restarts its server on the same port

## Goals

1. **Clear Identification** - URL includes artifact ID (e.g., `http://localhost:3045/a1b2c3`)
2. **Port Consistency** - Same artifact always uses the same port for session continuity
3. **Resource Cleanup** - Servers auto-stop after 1 minute to free up resources
4. **Seamless Resume** - Updating a stopped artifact restarts the server transparently
5. **Multi-Artifact Support** - Multiple artifacts can run simultaneously without conflict

## Non-Goals

1. **Persistent Sessions** - Artifact state is not preserved across system restarts
2. **Configurable Timeouts** - Fixed 1-minute timeout for now
3. **Port Ranges** - Use any available port, no specific range
