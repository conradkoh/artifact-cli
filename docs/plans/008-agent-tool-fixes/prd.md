# Plan 008: Agent Tool Fixes - PRD

## Glossary

| Term | Definition |
|------|------------|
| **btoa/atob** | Browser APIs for Base64 encoding/decoding (ASCII only) |
| **Buffer** | Node.js/Bun API for binary data handling (supports UTF-8) |
| **SSE** | Server-Sent Events - persistent HTTP connection for real-time updates |
| **idleTimeout** | Bun.serve option that closes connections after inactivity |
| **Hot Reload** | Automatic page refresh when code changes |

## User Stories

### US-1: Agent Creates Artifact with Emoji

**As an** AI agent,  
**I want to** create artifacts containing emoji and Unicode characters,  
**So that** I can generate visually rich components (fire 🔥, stars ⭐, etc.).

**Acceptance Criteria**:
- Agent calls `artifact-cli_create` with code containing emojis
- Code is correctly encoded, transmitted, and decoded
- Component file contains correct Unicode characters
- Artifact renders correctly in browser

**Bug Fixed**: `btoa()` throws `InvalidCharacterError` on non-ASCII characters

### US-2: Hot Reload Works After Extended Wait

**As a** user viewing an artifact preview,  
**I want** the page to automatically reload when code is updated,  
**So that** I see changes without manually refreshing.

**Acceptance Criteria**:
- SSE connection stays open indefinitely (no timeout)
- After waiting 15+ seconds, updates still trigger reload
- Browser console shows reload events being received
- Page refreshes automatically with new content

**Bug Fixed**: Bun.serve's default 10-second `idleTimeout` closes SSE connections

### US-3: Debug Logging for SSE Events

**As a** developer debugging hot reload issues,  
**I want** console logs showing SSE connection status,  
**So that** I can diagnose why reload might not be working.

**Acceptance Criteria**:
- Console shows `[artifact-cli] Hot reload connected` on connection
- Console shows `[artifact-cli] Received: <data>` for each event
- Console shows `[artifact-cli] Reloading page...` before reload
- Console shows error details if connection fails

## Root Cause Analysis

### Bug 1: UTF-8 Encoding Failure

**Symptom**: `ShellError: Failed with exit code 1` when creating artifacts

**Root Cause**: JavaScript's `btoa()` function only supports ASCII characters (0-255). When code contains Unicode characters (emojis, special symbols), `btoa()` throws `InvalidCharacterError`.

**Solution**: Use `Buffer.from(string).toString('base64')` for encoding and `Buffer.from(string, 'base64').toString('utf-8')` for decoding.

### Bug 2: SSE Connection Timeout

**Symptom**: Hot reload works initially but stops after ~10 seconds

**Root Cause**: Bun.serve has a default `idleTimeout` of 10 seconds. SSE connections are intentionally idle (waiting for events), so they get terminated.

**Solution**: Set `idleTimeout: 0` in Bun.serve configuration to disable the timeout.
