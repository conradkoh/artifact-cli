# Plan 011: Save Artifacts to Project Directory - PRD

## Glossary

| Term | Definition |
|------|------------|
| **Temp Artifact** | An artifact stored in the system temp directory (ephemeral) |
| **Saved Artifact** | An artifact stored in the project's `.artifact/` directory (persistent) |
| **Project Directory** | The current working directory where the user runs CLI commands |
| **Artifact Location** | Where the artifact data lives: "temp" or "saved" |

## User Stories

### US-1: Save an Artifact

**As a** developer who created a useful artifact,  
**I want** to save it to my project directory,  
**So that** it persists and can be committed to version control.

**Acceptance Criteria**:
- `artifact save <id>` copies artifact to `.artifact/saved/{id}/`
- Artifact is marked as "saved" in the registry
- Original temp artifact is removed
- Success message shows the save location

### US-2: Preview a Saved Artifact

**As a** developer returning to a project,  
**I want** to preview a previously saved artifact,  
**So that** I can continue working on it.

**Acceptance Criteria**:
- `artifact open <id>` works for saved artifacts
- Server starts using the saved artifact data
- Hot reload works with saved artifacts

### US-3: Clean Skips Saved Artifacts

**As a** developer cleaning up temp artifacts,  
**I want** `clean --all` to skip my saved artifacts,  
**So that** I don't accidentally delete important work.

**Acceptance Criteria**:
- `clean --all` only removes temp artifacts
- Saved artifacts are skipped by default
- New `--include-saved` flag to also clean saved artifacts
- Clear message about skipped saved artifacts

### US-4: List Shows Artifact Location

**As a** developer,  
**I want** to see which artifacts are saved vs temp,  
**So that** I know which ones are safe from cleanup.

**Acceptance Criteria**:
- `artifact list` shows a "Location" column (temp/saved)
- Saved artifacts show the project path
- Clear visual distinction between temp and saved

### US-5: Load Artifacts from .artifact/ on First Run

**As a** developer cloning a project with saved artifacts,  
**I want** those artifacts to be automatically discovered,  
**So that** I can preview them without manual setup.

**Acceptance Criteria**:
- CLI scans `.artifact/` in CWD on startup
- Discovered artifacts are registered if not already known
- `artifact list` shows all discoverable artifacts

### US-6: Unsave an Artifact

**As a** developer who no longer needs a saved artifact,  
**I want** to move it back to temp or delete it,  
**So that** I can clean up my project.

**Acceptance Criteria**:
- `artifact unsave <id>` moves artifact back to temp
- Or use `artifact clean <id> --force` to delete entirely
- Confirmation prompt for unsave (optional)

## Command Changes

### New Commands

| Command | Description |
|---------|-------------|
| `artifact save <id>` | Save artifact to `.artifact/` in CWD |
| `artifact unsave <id>` | Move saved artifact back to temp |

### Modified Commands

| Command | Change |
|---------|--------|
| `artifact list` | Add Location column (temp/saved) |
| `artifact clean --all` | Skip saved artifacts by default |
| `artifact clean --all --include-saved` | Also clean saved artifacts |
| `artifact open <id>` | Work with saved artifacts |
| `artifact create` | Add `--save` flag to save immediately |

## Edge Cases

### 1. Artifact Already Saved
If user runs `artifact save <id>` on an already-saved artifact:
- Show message: "Artifact is already saved at .artifact/saved/{id}/"

### 2. .artifact/saved/ Doesn't Exist
If `.artifact/saved/` directory doesn't exist:
- Create it automatically on first save

### 3. Conflict with Existing Directory
If `.artifact/saved/{id}/` already exists but artifact is not registered:
- Prompt user to overwrite or choose different ID
- Or fail with clear error message

### 4. CWD Changes
If user runs `artifact open` from a different directory:
- Saved artifact path is absolute in registry
- Works regardless of CWD

### 5. Project Cloned Without artifact-cli
If someone clones a project with `.artifact/saved/` but doesn't have CLI:
- `.artifact/saved/` is just a regular directory
- No impact until they install CLI
