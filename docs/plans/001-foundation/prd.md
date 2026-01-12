# Plan 001: Foundation - PRD

## Glossary

| Term                   | Definition                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| **Artifact**           | A previewable unit consisting of a React component, its dependencies, and an associated server instance |
| **Artifact ID**        | A short unique identifier (e.g., `a1b2c3`) used to reference an artifact across commands                |
| **Component Analysis** | The process of parsing a React component file to extract its code, dependencies, and local imports      |
| **Sandpack**           | CodeSandbox's in-browser bundler that can compile and run React code without a build step               |
| **Hot Reload**         | Updating a running artifact's code without restarting the server                                        |
| **Temp Directory**     | System temporary directory (`os.tmpdir()`) where artifact files are generated                           |
| **Preview Server**     | A Bun HTTP server that serves the Sandpack-based preview application                                    |

## User Stories

### US-001: Create an Artifact

**As a** developer,  
**I want to** create a preview of a React component by providing its file path,  
**So that** I can see the component rendered in isolation in my browser.

**Acceptance Criteria:**

- [ ] Running `artifact create ./src/Button.tsx` generates preview files in temp directory
- [ ] The CLI parses the component file using TypeScript AST
- [ ] All npm dependencies are identified and included in Sandpack config
- [ ] Local imports (relative paths) are resolved and bundled
- [ ] A server starts on an available port
- [ ] The CLI outputs the artifact ID and URL
- [ ] The artifact metadata is persisted for future reference

**Example:**

```bash
$ artifact create ./src/components/Button.tsx

✓ Artifact created successfully!
  ID:  a1b2c3
  URL: http://localhost:3001

  To update: artifact update a1b2c3
  To preview: artifact preview a1b2c3
```

---

### US-002: Update an Artifact

**As a** developer,  
**I want to** update an existing artifact when I modify my component code,  
**So that** I can see my changes without restarting the server.

**Acceptance Criteria:**

- [ ] Running `artifact update <id>` re-parses the source file
- [ ] The generated Sandpack files are updated
- [ ] Hot reload is triggered (page auto-refreshes or HMR kicks in)
- [ ] The artifact's `updatedAt` timestamp is updated
- [ ] Error is shown if artifact ID doesn't exist
- [ ] Works without specifying file path (uses original source file)

**Example:**

```bash
$ artifact update a1b2c3

✓ Artifact updated!
  ID:  a1b2c3
  URL: http://localhost:3001
```

---

### US-003: Preview an Artifact

**As a** developer,  
**I want to** open an artifact's preview URL in my browser,  
**So that** I can view the component without copying/pasting the URL.

**Acceptance Criteria:**

- [ ] Running `artifact preview <id>` opens the URL in the default browser
- [ ] Uses the `open` command (macOS) / `xdg-open` (Linux) / `start` (Windows)
- [ ] Error is shown if artifact ID doesn't exist
- [ ] Error is shown if artifact server is not running

**Example:**

```bash
$ artifact preview a1b2c3

✓ Opening http://localhost:3001 in browser...
```

---

### US-004: Component Dependency Resolution

**As a** developer,  
**I want** my component's imports to be automatically resolved,  
**So that** I don't have to manually specify dependencies.

**Acceptance Criteria:**

- [ ] npm package imports (e.g., `import React from 'react'`) are detected
- [ ] Local relative imports (e.g., `import { utils } from './utils'`) are resolved
- [ ] Recursively resolve imports from local files (1-2 levels deep)
- [ ] TypeScript/TSX files are properly handled
- [ ] Export detection finds the primary component export

---

### US-005: Artifact Persistence

**As a** developer,  
**I want** artifact metadata to persist across CLI invocations,  
**So that** I can reference artifacts by ID after creating them.

**Acceptance Criteria:**

- [ ] Artifact metadata stored in a JSON file in temp directory
- [ ] Metadata includes: id, sourceFile, componentName, port, pid, status, timestamps
- [ ] Stale artifacts (server no longer running) are detectable
- [ ] Artifacts survive CLI process exit (servers run in background)
