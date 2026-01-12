# Plan 003: NPM Distribution - PRD

## Glossary

| Term | Definition |
|------|------------|
| **npx** | npm package runner that executes packages without global installation |
| **Global Install** | Installing a package system-wide with `npm install -g` |
| **bin** | Package.json field that specifies CLI entry points |
| **Shebang** | `#!/usr/bin/env` line at the start of a script specifying the interpreter |

## User Stories

### US-001: Run via npx

**As a** developer,  
**I want to** run artifact-cli via npx without installing it,  
**So that** I can quickly try it out or use it occasionally.

**Acceptance Criteria:**
- [ ] Running `npx artifact-cli create ./Component.tsx` works
- [ ] Running `npx artifact-cli update <id>` works
- [ ] Running `npx artifact-cli preview <id>` works
- [ ] No prior installation of Bun required
- [ ] Works on macOS, Linux, and Windows

**Example:**
```bash
$ npx artifact-cli create ./src/Button.tsx

✓ Artifact created successfully!
  ID:  a1b2c3
  URL: http://localhost:3001
```

---

### US-002: Global Installation

**As a** developer,  
**I want to** install artifact-cli globally,  
**So that** I can use the `artifact` command from anywhere.

**Acceptance Criteria:**
- [ ] Running `npm install -g artifact-cli` installs the CLI
- [ ] The `artifact` command is available globally
- [ ] Running `artifact create ./Component.tsx` works
- [ ] Running `artifact --version` shows version
- [ ] Running `artifact --help` shows help

**Example:**
```bash
$ npm install -g artifact-cli
$ artifact create ./src/Button.tsx

✓ Artifact created successfully!
  ID:  a1b2c3
  URL: http://localhost:3001
```

---

### US-003: Bundled Bun Runtime

**As a** developer,  
**I want** artifact-cli to work without installing Bun separately,  
**So that** I have a seamless experience.

**Acceptance Criteria:**
- [ ] Bun is included as a dependency
- [ ] The CLI automatically uses the bundled Bun
- [ ] Works even if user doesn't have Bun installed globally
- [ ] Correct Bun binary is used based on platform (darwin/linux/windows)
