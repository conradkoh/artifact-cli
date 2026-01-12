# Plan 011: Save Artifacts to Project Directory

## Summary

Add a `save` command that copies an artifact from the temp directory to the user's project directory (`.artifact/saved/`), allowing artifacts to be committed to version control and persist across CLI upgrades and system restarts.

## Current State

Currently, all artifacts are stored in the system temp directory:
```
{tmpdir}/artifact-cli/artifacts/{id}/
├── component.tsx
└── .runtime/
```

**Problems:**
1. Artifacts are lost on system restart or temp cleanup
2. Artifacts can't be committed to version control
3. `clean --all` removes all artifacts indiscriminately
4. Team members can't share artifacts

## Proposed Change

Add a `save` command that:
1. Copies artifact data to `.artifact/saved/{id}/` in the current working directory
2. Marks the artifact as "saved" in the registry
3. Updates artifact's `tempDir` to point to the project directory

**New structure:**
```
my-project/
├── .artifact/
│   └── saved/
│       └── {id}/
│           └── component.tsx    # Saved artifact
├── src/
└── package.json
```

Note: `.artifact/` is the root folder for all artifact-cli related data. The `saved/` subdirectory specifically contains saved artifacts, leaving room for other data types in the future.

## Goals

1. **Persistence** - Saved artifacts survive system restarts and temp cleanup
2. **Version Control** - Artifacts can be committed to git
3. **Team Sharing** - Team members can preview shared artifacts
4. **Clean Safety** - `clean --all` skips saved artifacts by default
5. **Seamless Preview** - `artifact open <id>` works for saved artifacts

## Non-Goals

1. **Auto-save** - Artifacts are not auto-saved; user must explicitly save
2. **Sync** - No automatic sync between temp and saved versions
3. **Multiple Save Locations** - Only `.artifact/` in CWD is supported
4. **Nested Artifacts** - No support for `.artifact/` inside `.artifact/`
