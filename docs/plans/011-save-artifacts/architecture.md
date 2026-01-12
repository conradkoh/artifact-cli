# Plan 011: Save Artifacts to Project Directory - Architecture

## Changes Overview

| Component | Type | Description |
|-----------|------|-------------|
| Artifact Entity | Modified | Add `location` field (temp/saved), `savedPath` field |
| save.ts | New | CLI command to save artifact to project |
| unsave.ts | New | CLI command to move artifact back to temp |
| list.ts | Modified | Show location column |
| clean.ts | Modified | Skip saved artifacts by default |
| FileArtifactRepository | Modified | Support saved artifact discovery |
| BunServerManager | Modified | Handle saved artifact paths |

## Modified Entities

### Artifact Entity

```typescript
export type ArtifactLocation = 'temp' | 'saved';

export interface Artifact {
  id: string;
  sourceFile: string | null;
  sourceCode: string | null;
  componentName: string;
  tempDir: string;              // Still used for runtime state
  port: number;
  url: string;
  pid: number | null;
  status: ArtifactStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // New fields
  location: ArtifactLocation;   // 'temp' or 'saved'
  savedPath: string | null;     // Absolute path to saved .artifact/{id}/ directory
}
```

## New Commands

### `artifact save <id>`

```typescript
// src/cli/commands/save.ts

export function saveCommand(): Command {
  const cmd = new Command("save");

  cmd
    .description("Save artifact to project directory (.artifact/saved/)")
    .argument("<id>", "Artifact ID to save")
    .action(async (id: string) => {
      // 1. Find artifact
      const artifact = await repository.findById(id);
      if (!artifact) throw new Error("Artifact not found");
      
      // 2. Check if already saved
      if (artifact.location === 'saved') {
        console.log(`Artifact already saved at ${artifact.savedPath}`);
        return;
      }
      
      // 3. Create .artifact/saved/{id}/ in CWD
      const saveDir = join(process.cwd(), '.artifact', 'saved', id);
      mkdirSync(saveDir, { recursive: true });
      
      // 4. Copy component.tsx from temp to saved
      const tempComponent = join(artifact.tempDir, 'component.tsx');
      const savedComponent = join(saveDir, 'component.tsx');
      copyFileSync(tempComponent, savedComponent);
      
      // 5. Update artifact metadata
      artifact.location = 'saved';
      artifact.savedPath = saveDir;
      artifact.tempDir = saveDir;  // Server now uses saved path
      await repository.save(artifact);
      
      // 6. Remove from temp (but keep runtime state)
      const tempDir = getArtifactDir(id);
      rmSync(join(tempDir, 'component.tsx'), { force: true });
      
      console.log(`✓ Artifact saved to .artifact/saved/${id}/`);
    });

  return cmd;
}
```

### `artifact unsave <id>`

```typescript
// src/cli/commands/unsave.ts

export function unsaveCommand(): Command {
  const cmd = new Command("unsave");

  cmd
    .description("Move saved artifact back to temp directory")
    .argument("<id>", "Artifact ID to unsave")
    .action(async (id: string) => {
      // 1. Find artifact
      const artifact = await repository.findById(id);
      if (!artifact) throw new Error("Artifact not found");
      
      // 2. Check if saved
      if (artifact.location !== 'saved') {
        console.log(`Artifact is not saved (location: ${artifact.location})`);
        return;
      }
      
      // 3. Copy back to temp
      const tempDir = getArtifactDir(id);
      mkdirSync(tempDir, { recursive: true });
      
      const savedComponent = join(artifact.savedPath!, 'component.tsx');
      const tempComponent = join(tempDir, 'component.tsx');
      copyFileSync(savedComponent, tempComponent);
      
      // 4. Update artifact metadata
      artifact.location = 'temp';
      artifact.tempDir = tempDir;
      artifact.savedPath = null;
      await repository.save(artifact);
      
      // 5. Optionally remove saved directory
      // (leave it for now, user can git rm if needed)
      
      console.log(`✓ Artifact moved back to temp`);
    });

  return cmd;
}
```

## Modified Commands

### list.ts

Add Location column:

```typescript
console.log(
  "  " +
    "ID".padEnd(10) +
    "Component".padEnd(20) +
    "Status".padEnd(12) +
    "Watchers".padEnd(10) +
    "Location".padEnd(10) +  // NEW
    "URL"
);

// In the loop:
const location = artifact.location === 'saved' ? 'saved' : 'temp';
const locationColor = artifact.location === 'saved' ? '\x1b[36m' : '\x1b[90m'; // cyan or gray
```

### clean.ts

Skip saved artifacts by default:

```typescript
cmd
  .option("--include-saved", "Also clean saved artifacts")
  .action(async (id, options) => {
    // ...
    for (const artifact of artifacts) {
      // Skip saved artifacts unless --include-saved
      if (artifact.location === 'saved' && !options.includeSaved) {
        savedSkippedCount++;
        continue;
      }
      // ... rest of clean logic
    }
    
    if (savedSkippedCount > 0) {
      console.log(`  Skipped ${savedSkippedCount} saved artifacts (use --include-saved to remove)`);
    }
  });
```

## File Structure

### Before (temp only)

```
{tmpdir}/artifact-cli/
├── artifacts.json           # All artifact metadata
└── artifacts/
    └── {id}/
        ├── component.tsx    # Component code
        └── .runtime/        # Runtime state
```

### After (temp + saved)

```
{tmpdir}/artifact-cli/
├── artifacts.json           # All artifact metadata (includes saved)
└── artifacts/
    └── {id}/
        └── .runtime/        # Runtime state (for saved too)

my-project/
└── .artifact/               # Root folder for all artifact-cli data
    └── saved/               # Saved artifacts
        └── {id}/
            └── component.tsx    # Saved component code
```

**Key insight**: Runtime state (`.runtime/`) stays in temp even for saved artifacts, because:
- PID files and logs are ephemeral
- No need to pollute project with runtime state
- Server knows to look in temp for runtime, saved path for component

## Server Changes

### BunServerManager

When starting a server for a saved artifact:
- Read `component.tsx` from `artifact.savedPath` (or `artifact.tempDir`)
- Write runtime state to `getArtifactRuntimeDir(artifact.id)` (always temp)

```typescript
async start(artifact: Artifact): Promise<{ pid: number; port: number }> {
  // Runtime always in temp
  const runtimeDir = getArtifactRuntimeDir(artifact.id);
  mkdirSync(runtimeDir, { recursive: true });
  
  // Component path depends on location
  const artifactDir = artifact.location === 'saved' 
    ? artifact.savedPath! 
    : getArtifactDir(artifact.id);
  
  // Start server with correct paths
  // ...
}
```

### artifactServer.ts

The server receives `artifactDir` as an argument, so no changes needed - it already works with any path.

## Discovery of Saved Artifacts

When user runs any command, we should scan `.artifact/saved/` in CWD:

```typescript
// In FileArtifactRepository or a new DiscoveryService

async discoverSavedArtifacts(): Promise<void> {
  const savedDir = join(process.cwd(), '.artifact', 'saved');
  if (!existsSync(savedDir)) return;
  
  const entries = readdirSync(savedDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const id = entry.name;
    const componentPath = join(savedDir, id, 'component.tsx');
    if (!existsSync(componentPath)) continue;
    
    // Check if already registered
    const existing = await this.findById(id);
    if (existing) continue;
    
    // Register discovered artifact
    const artifact = createArtifact({
      id,
      sourceCode: readFileSync(componentPath, 'utf-8'),
      componentName: await detectComponentName(componentPath),
      tempDir: join(savedDir, id),
      port: await findAvailablePort(),
    });
    artifact.location = 'saved';
    artifact.savedPath = join(savedDir, id);
    await this.save(artifact);
  }
}
```

## Migration

Existing artifacts default to `location: 'temp'` and `savedPath: null`.

When reading artifacts.json, if `location` is missing:
```typescript
return parsed.map((a: any) => ({
  ...a,
  location: a.location ?? 'temp',
  savedPath: a.savedPath ?? null,
  createdAt: new Date(a.createdAt),
  updatedAt: new Date(a.updatedAt),
}));
```

## Implementation Steps

1. Update `Artifact` entity with new fields
2. Update `FileArtifactRepository` to handle migration
3. Create `save.ts` command
4. Create `unsave.ts` command  
5. Update `list.ts` to show location
6. Update `clean.ts` to skip saved by default
7. Update `BunServerManager` for saved artifact paths
8. Add discovery on CLI startup
9. Test all flows
