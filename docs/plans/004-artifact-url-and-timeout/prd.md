# Plan 004: Artifact URL and Auto-Timeout - PRD

## Glossary

| Term | Definition |
|------|------------|
| **Artifact URL** | Full URL including artifact ID: `http://localhost:<port>/<artifact-id>` |
| **Auto-Timeout** | Server automatically stops after a period of inactivity |
| **Session Continuity** | Same artifact uses same port across restarts |
| **Heartbeat** | Periodic signal from browser to keep server alive |

## User Stories

### US-001: Artifact ID in URL

**As a** developer,  
**I want** the artifact ID to be visible in the URL,  
**So that** I can easily identify which artifact I'm viewing when multiple are open.

**Acceptance Criteria:**
- [ ] URL format is `http://localhost:<port>/<artifact-id>`
- [ ] Artifact ID is displayed in the browser address bar
- [ ] Navigating to the URL directly loads the correct artifact
- [ ] Invalid artifact IDs show a 404 error page

**Example:**
```
http://localhost:3045/a1b2c3
```

---

### US-002: Randomized Port Per Artifact

**As a** developer,  
**I want** each artifact to have its own random port,  
**So that** multiple artifacts can run simultaneously.

**Acceptance Criteria:**
- [ ] Port is randomly selected from available ports
- [ ] Port is stored in artifact metadata
- [ ] Same artifact always uses the same port (if available)
- [ ] If port is taken, a new port is selected and metadata updated

---

### US-003: Auto-Timeout After Inactivity

**As a** developer,  
**I want** artifact servers to automatically stop after 1 minute,  
**So that** system resources are freed up when not in use.

**Acceptance Criteria:**
- [ ] Server stops automatically after ~60 seconds of inactivity
- [ ] Timeout resets when the preview page is open (heartbeat)
- [ ] Artifact metadata is updated to reflect stopped status
- [ ] CLI shows server has stopped if user tries to update

---

### US-004: Auto-Restart on Update

**As a** developer,  
**I want** the server to automatically restart when I update a stopped artifact,  
**So that** I can resume my session seamlessly.

**Acceptance Criteria:**
- [ ] `artifact update <id>` restarts server if not running
- [ ] Server uses the same port as before (if available)
- [ ] URL remains the same after restart
- [ ] Preview loads immediately after update
- [ ] CLI output indicates server was restarted

**Example:**
```bash
$ artifact update a1b2c3

✓ Artifact server restarted
✓ Artifact updated!
  ID:  a1b2c3
  URL: http://localhost:3045/a1b2c3
```

---

### US-005: Consistent Artifact ID Across System

**As a** developer,  
**I want** the artifact ID to be consistent everywhere,  
**So that** I can easily correlate UI, CLI, and files.

**Acceptance Criteria:**
- [ ] Artifact ID shown in browser header
- [ ] Artifact ID in URL path
- [ ] Artifact ID in CLI output
- [ ] Artifact files stored in `<temp>/artifact-cli/artifacts/<id>/`
