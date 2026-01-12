# Plan 009: Separate Runtime from Data - PRD

## Glossary

| Term | Definition |
|------|------------|
| **Runtime Code** | Server and wrapper code provided by the CLI (not user data) |
| **Artifact Data** | User-created component source code |
| **Ephemeral State** | Temporary files like PID, logs that can be regenerated |
| **Unified Server** | Single server process serving multiple artifacts |
| **On-the-fly Generation** | Creating HTML at request time rather than storing it |

## User Stories

### US-1: CLI Upgrade Improves All Artifacts

**As a** user who upgrades artifact-cli,  
**I want** all my existing artifacts to use the new server/wrapper code,  
**So that** I get bug fixes and improvements without recreating artifacts.

**Acceptance Criteria**:
- After upgrading CLI, running `artifact open <id>` uses new code
- No manual migration or cleanup required
- Existing component source code is preserved

### US-2: Minimal Disk Usage

**As a** user with many artifacts,  
**I want** the temp folder to only store my component code,  
**So that** disk space isn't wasted on duplicated server code.

**Acceptance Criteria**:
- Each artifact folder contains only `component.tsx` and runtime state
- No `server.ts` or `index.html` stored per artifact
- Total storage ≈ sum of component file sizes

### US-3: Clean Artifact Data

**As a** developer,  
**I want** to clearly see what data belongs to each artifact,  
**So that** I can debug or backup artifacts easily.

**Acceptance Criteria**:
- Artifact folder structure is simple and obvious
- User data (component.tsx) is separate from runtime state (pid, logs)
- No confusion about what's CLI code vs user code

### US-4: Single Server Process (Optional Enhancement)

**As a** user running multiple artifacts,  
**I want** a single server process handling all artifacts,  
**So that** I use less system resources.

**Acceptance Criteria**:
- One server process serves all active artifacts
- Each artifact accessible at `http://localhost:{port}/{artifactId}`
- Server starts on first artifact open, stops when all closed

## Architecture Options

### Option A: Per-Artifact Server (Current, Modified)

Keep one server per artifact, but:
- Server code is a CLI module, not copied to temp
- Server receives artifact path as argument
- Wrapper HTML generated at request time

**Pros**: Isolation, simpler error handling
**Cons**: More processes, more ports

### Option B: Unified Server (New)

Single server process for all artifacts:
- One port for all artifacts
- Route by artifact ID in URL path
- Start on demand, stop when idle

**Pros**: Less resources, simpler management
**Cons**: Shared fate (one crash affects all)

### Recommendation

Start with **Option A (Modified)** as it's less disruptive:
- Keeps current per-artifact isolation
- Only changes where code lives (CLI vs temp)
- Can evolve to Option B later if needed
