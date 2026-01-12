# Plan 002: Preview UI Improvements - PRD

## Glossary

| Term | Definition |
|------|------------|
| **Code Tab** | View showing the Sandpack code editor with file tabs |
| **Preview Tab** | View showing only the rendered component output |
| **Full Screen Mode** | Preview fills the entire browser viewport |

## User Stories

### US-001: Full Screen Preview with Tabs

**As a** developer,  
**I want** the artifact preview to show in full screen with Code/Preview tabs,  
**So that** I can focus on either the code or the rendered output without distraction.

**Acceptance Criteria:**
- [ ] Preview fills the entire viewport (no wasted space)
- [ ] Two tabs at the top: "Code" and "Preview"
- [ ] Code tab shows the Sandpack code editor with file tabs
- [ ] Preview tab shows only the rendered component
- [ ] Tabs are clearly visible and easy to click
- [ ] Current tab is visually indicated

---

### US-002: Remove Open Sandbox Button

**As a** developer,  
**I want** the "Open Sandbox" button hidden,  
**So that** the preview UI is clean and uncluttered.

**Acceptance Criteria:**
- [ ] "Open Sandbox" button is not visible
- [ ] No overlay buttons obscure the preview area
- [ ] Refresh button can remain if useful
