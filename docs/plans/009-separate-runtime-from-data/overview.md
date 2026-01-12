# Plan 009: Separate Runtime from Data

## Summary

Restructure the temp folder architecture to separate **runtime code** (provided by CLI) from **artifact data** (user-generated). This ensures CLI upgrades automatically improve all artifacts without leaving stale code in the temp folder.

## Current Architecture (Problem)

```
{tmpdir}/artifact-cli/artifacts/{id}/
├── component.tsx       # User data ✓
├── index.html          # Generated wrapper (becomes stale on CLI upgrade) ✗
├── server.ts           # Copied server code (becomes stale on CLI upgrade) ✗
├── server.pid          # Runtime state
├── server.log          # Runtime state
└── .reload             # Runtime signal
```

**Problems:**
1. Server code is copied per artifact → stale on CLI upgrade
2. Sandpack wrapper is generated per artifact → stale on CLI upgrade
3. Improvements to server/wrapper don't apply to existing artifacts
4. Disk space wasted on duplicated code

## Proposed Architecture (Solution)

```
{tmpdir}/artifact-cli/
├── artifacts.json                    # Artifact metadata
└── artifacts/
    └── {id}/
        ├── component.tsx             # User data (only this!)
        └── runtime/                  # Ephemeral runtime state
            ├── server.pid
            ├── server.log
            └── .reload

CLI provides at runtime:
- Server code (in memory, not copied)
- Sandpack wrapper template (generated fresh each time)
```

**Key Changes:**
1. **Server runs from CLI source** - No more copying server.ts to temp folder
2. **Wrapper generated on-the-fly** - HTML created at request time, not stored
3. **Temp folder only stores user data** - Just the component source code
4. **Runtime state is ephemeral** - PID/log files are temporary, can be deleted

## Goals

1. **CLI Upgrades Apply Immediately** - New server/wrapper code used automatically
2. **Minimal Temp Storage** - Only store what the user created
3. **No Stale Code** - No lingering old server.ts or index.html files
4. **Backwards Compatible** - Existing artifacts continue to work

## Non-Goals

1. **Persist Runtime State** - PID files, logs are ephemeral
2. **Version Locking** - Artifacts always use current CLI version
3. **Multiple Component Files** - Still single component per artifact
