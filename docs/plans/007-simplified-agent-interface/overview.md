# Plan 007: Simplified Agent Interface

## Summary

Redesign the artifact-cli OpenCode integration to expose only **3 tools** to the AI agent, with the CLI managing all internal complexity transparently. The agent will pass component code directly (not file paths), and the CLI will handle file management, server lifecycle, and cleanup internally.

This plan fundamentally changes the contract between the AI agent and artifact-cli to be more agent-friendly and less error-prone.

## Goals

1. **Reduce Tool Count** - Expose exactly 3 tools: `create`, `update`, and `open`
2. **Inline Code** - Agent passes component code directly, not file paths
3. **Transparent Server Management** - CLI manages servers automatically; no `list` or `stop` exposed to agent
4. **Automatic Lifecycle** - Servers start/stop as needed; agent doesn't manage this
5. **Graceful Preview Handling** - `open` works for revisiting artifacts, handles missing artifacts gracefully

## Non-Goals

1. **Remove CLI Commands** - The full CLI (`artifact list`, `artifact stop`) remains for human users
2. **Change Core Architecture** - Domain layer and infrastructure remain largely unchanged
3. **Multi-file Artifacts** - Single component per artifact (no bundled projects)
4. **Remote Hosting** - Still local development only

## Key Design Decisions

### 1. Code Passed Inline vs File Path

**Current**: Agent provides a file path → CLI reads file from disk
**New**: Agent provides code directly → CLI writes to internal temp directory

**Rationale**:
- Reduces coupling to agent's file system context
- Agent doesn't need to know where files are written
- Simplifies the agent's mental model
- Avoids path resolution issues across different environments

### 2. Only 3 Tools Exposed

| Tool | Purpose |
|------|---------|
| `artifact_create` | Create artifact, start server, return ID and instructions |
| `artifact_update` | Update code for existing artifact, wait until ready |
| `artifact_open` | Open preview in browser (handles not-found gracefully) |

**What's hidden from agent**:
- `list` - Agent doesn't need to query artifact state
- `stop` - CLI provides cleanup instructions; agent follows them

### 3. Create Returns Cleanup Instructions

When `create` returns, it includes:
- Artifact ID
- Preview URL  
- Instructions on how to stop the server (for agent to relay to user if needed)

### 4. Open Handles All Edge Cases

The `open` tool:
- If artifact exists and server running → opens in browser
- If artifact exists but server stopped → starts server, then opens
- If artifact not found → returns "Artifact not found" message

## Artifact Lifecycle Flows

### Flow 1: Creating a New Artifact

```
Agent                              CLI                              User
  │                                  │                                │
  │─── create(code) ─────────────────►                                │
  │                                  │ Write code to temp dir         │
  │                                  │ Parse component                │
  │                                  │ Start server                   │
  │                                  │                                │
  │◄── { id, url, stopInstructions } │                                │
  │                                  │                                │
  │ (Agent decides whether to open)  │                                │
  │─── open(id) ─────────────────────►                                │
  │                                  │─────────── Opens browser ──────►
```

### Flow 2: Updating an Artifact

```
Agent                              CLI                              User
  │                                  │                                │
  │─── update(id, code) ─────────────►                                │
  │                                  │ Write new code to temp dir     │
  │                                  │ Regenerate Sandpack            │
  │                                  │ Hot reload (or restart server) │
  │                                  │                                │
  │◄── { id, url, status: ready }    │                                │
```

### Flow 3: Revisiting an Old Artifact

```
Agent                              CLI                              User
  │                                  │                                │
  │─── open(id) ─────────────────────►                                │
  │                                  │ Check if artifact exists       │
  │                                  │                                │
  │ [If not found]                   │                                │
  │◄── "Artifact not found"          │                                │
  │                                  │                                │
  │ [If found but stopped]           │                                │
  │                                  │ Start server                   │
  │                                  │─────────── Opens browser ──────►
  │◄── { id, url }                   │                                │
  │                                  │                                │
  │ [If found and running]           │                                │
  │                                  │─────────── Opens browser ──────►
  │◄── { id, url }                   │                                │
```
