# Plan 007: Simplified Agent Interface - PRD

## Glossary

| Term | Definition |
|------|------------|
| **Agent** | The AI model (e.g., OpenCode's LLM) that calls artifact-cli tools |
| **Tool** | A callable function exposed to the agent via OpenCode's plugin system |
| **Inline Code** | Component source code passed directly as a string argument |
| **Artifact** | A preview instance with an ID, generated files, and optional running server |
| **Cleanup Instructions** | Human-readable instructions for stopping servers |
| **Hot Reload** | Updating the preview without restarting the server |

## User Stories

### US-1: Agent Creates a New Artifact

**As an** AI agent,  
**I want to** create an artifact by passing component code directly,  
**So that** I don't need to manage file paths or know the file system structure.

**Acceptance Criteria**:
- Agent calls `artifact_create` with `code` parameter (React component as string)
- CLI writes code to internal temp directory (managed by CLI)
- CLI parses component, generates Sandpack, starts server
- Agent receives: artifact ID, preview URL, cleanup instructions
- Agent does NOT receive: file paths, temp directory locations

### US-2: Agent Updates an Existing Artifact

**As an** AI agent,  
**I want to** update an artifact with new code,  
**So that** the preview reflects the latest changes.

**Acceptance Criteria**:
- Agent calls `artifact_update` with `id` and `code` parameters
- CLI writes new code to the existing artifact's temp directory
- CLI regenerates Sandpack HTML
- CLI triggers hot reload (or restarts server if stopped)
- Agent receives confirmation that update is complete
- If artifact ID doesn't exist, agent receives clear error message

### US-3: Agent Opens an Artifact Preview

**As an** AI agent,  
**I want to** open an artifact preview in the user's browser,  
**So that** the user can see the rendered component.

**Acceptance Criteria**:
- Agent calls `artifact_open` with `id` parameter
- If artifact exists and server running → opens in browser
- If artifact exists but server stopped → starts server, then opens
- If artifact not found → returns "Artifact not found (may have been deleted)"
- Agent does NOT need to check server status beforehand

### US-4: Agent Receives Cleanup Instructions

**As an** AI agent,  
**I want to** receive clear instructions on how servers can be stopped,  
**So that** I can inform the user if they want to free up resources.

**Acceptance Criteria**:
- `artifact_create` response includes human-readable stop instructions
- Instructions reference the CLI command (`artifact stop <id>` or `artifact stop --all`)
- Agent can relay these to user at appropriate time

### US-5: Minimal Agent Cognitive Load

**As an** AI agent,  
**I want** a minimal set of tools with clear purposes,  
**So that** I don't waste tokens on unnecessary decisions.

**Acceptance Criteria**:
- Only 3 tools exposed: `create`, `update`, `open`
- No `list` tool (agent doesn't query state)
- No `stop` tool (cleanup instructions provided instead)
- Each tool has a clear, single responsibility

## Out of Scope

- Exposing `list` or `stop` to the agent
- Supporting multiple files per artifact
- Custom output directories
- Agent managing server lifecycle directly
