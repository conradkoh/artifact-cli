# Plan 005: OpenCode Integration - PRD

## Glossary

| Term | Definition |
|------|------------|
| **OpenCode** | An AI coding assistant that supports custom tools |
| **Custom Tool** | A function that OpenCode's LLM can call during conversations |
| **Tool Definition** | TypeScript file in `~/.config/opencode/tool/` defining the tool |

## User Stories

### US-001: Install OpenCode Tool

**As a** developer using OpenCode,  
**I want to** install artifact-cli as a custom tool,  
**So that** OpenCode can create and manage artifact previews for me.

**Acceptance Criteria:**
- [ ] Running `artifact opencode install` creates the tool file
- [ ] Tool file is placed at `~/.config/opencode/tool/artifact-cli.ts`
- [ ] Directory is created if it doesn't exist
- [ ] Success message confirms installation
- [ ] Overwrites existing file if present

**Example:**
```bash
$ artifact opencode install

✓ OpenCode tool installed successfully!
  Location: ~/.config/opencode/tool/artifact-cli.ts
  
  Available tools:
    - artifact-cli_create: Create a preview from a React component
    - artifact-cli_update: Update an existing preview
    - artifact-cli_preview: Open preview in browser
```

---

### US-002: OpenCode Can Create Artifacts

**As an** OpenCode user,  
**I want** OpenCode to create artifact previews for me,  
**So that** I can see my React components rendered while coding.

**Acceptance Criteria:**
- [ ] OpenCode can call `artifact-cli_create` with a file path
- [ ] Returns artifact ID and URL on success
- [ ] Returns error message on failure

---

### US-003: OpenCode Can Update Artifacts

**As an** OpenCode user,  
**I want** OpenCode to update existing artifacts,  
**So that** I can see my changes without manually running commands.

**Acceptance Criteria:**
- [ ] OpenCode can call `artifact-cli_update` with an artifact ID
- [ ] Returns success message with URL
- [ ] Returns error message on failure
