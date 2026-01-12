# Plan 006: Server Lifecycle Improvements - PRD

## Glossary

| Term | Definition |
|------|------------|
| **Server Lifecycle** | The lifetime of an artifact preview server |
| **Running Server** | A background process serving the artifact preview |
| **Stale Artifact** | An artifact whose server has stopped |

## User Stories

### US-001: List Artifacts

**As a** developer,  
**I want to** see all my artifacts and their status,  
**So that** I can manage them effectively.

**Acceptance Criteria:**
- [ ] `artifact list` shows all artifacts
- [ ] Shows ID, component name, URL, and status (running/stopped)
- [ ] Shows PID for running servers
- [ ] Shows "No artifacts found" if empty

**Example:**
```bash
$ artifact list

Artifacts:
  ID      Component       Status    URL
  a1b2c3  Button          running   http://localhost:3001/a1b2c3
  d4e5f6  FireAnimation   stopped   http://localhost:3002/d4e5f6
```

---

### US-002: Stop Single Server

**As a** developer,  
**I want to** stop a specific artifact server,  
**So that** I can free up resources.

**Acceptance Criteria:**
- [ ] `artifact stop <id>` stops the server
- [ ] Updates artifact status to "stopped"
- [ ] Shows error if artifact not found
- [ ] Shows message if server already stopped

**Example:**
```bash
$ artifact stop a1b2c3

✓ Server stopped for artifact a1b2c3
```

---

### US-003: Stop All Servers

**As a** developer,  
**I want to** stop all running servers at once,  
**So that** I can clean up quickly.

**Acceptance Criteria:**
- [ ] `artifact stop --all` stops all running servers
- [ ] Shows count of servers stopped
- [ ] Shows "No running servers" if none active

**Example:**
```bash
$ artifact stop --all

✓ Stopped 3 running servers
```

---

### US-004: Remove Auto-Timeout

**As a** developer,  
**I want** servers to run until I stop them,  
**So that** I don't have to deal with unexpected timeouts.

**Acceptance Criteria:**
- [ ] Servers no longer auto-timeout after 60s
- [ ] Heartbeat mechanism removed (no longer needed)
- [ ] Servers run indefinitely until stopped manually

---

### US-005: Improved OpenCode Tool Descriptions

**As an** OpenCode user,  
**I want** clear tool descriptions,  
**So that** I understand how artifact-cli works.

**Acceptance Criteria:**
- [ ] `artifact-cli_create` describes Sandpack usage, file requirements
- [ ] `artifact-cli_list` tool added
- [ ] `artifact-cli_stop` tool added
- [ ] All tools mention that servers run until stopped
