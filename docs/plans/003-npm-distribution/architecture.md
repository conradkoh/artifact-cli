# Plan 003: NPM Distribution - Architecture

## Changes Overview

| Component | Type | Description |
|-----------|------|-------------|
| package.json | Modified | Add bin, files, publish config, metadata |
| bin/artifact.js | New | Node.js wrapper that invokes Bun |
| postinstall script | New | Downloads platform-specific Bun binary |

## Implementation Strategy

### Approach: Node.js Wrapper with Bundled Bun

Since npm packages run in Node.js by default, we need a strategy to run our Bun-based CLI:

1. **Entry Point** (`bin/artifact.js`) - A Node.js script that:
   - Locates the bundled Bun binary
   - Spawns Bun to run the actual CLI (`index.ts`)
   - Passes through all arguments

2. **Bun Binary** - Use `@aspect-build/bun` or similar package that provides platform-specific Bun binaries, or use a postinstall script to download Bun.

### Package Structure

```
artifact-cli/
├── bin/
│   └── artifact.js         # Node.js entry point (shebang: node)
├── src/                    # TypeScript source
├── index.ts                # Bun entry point
├── package.json            # npm package config
└── ...
```

### package.json Updates

```json
{
  "name": "artifact-cli",
  "version": "0.1.0",
  "description": "CLI tool for previewing React components in isolated sandboxes",
  "bin": {
    "artifact": "./bin/artifact.js",
    "artifact-cli": "./bin/artifact.js"
  },
  "files": [
    "bin/",
    "src/",
    "index.ts",
    "docs/"
  ],
  "keywords": ["react", "preview", "sandpack", "cli", "component"],
  "author": "",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": ""
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "@aspect-build/bun": "^1.0.0",
    "commander": "^14.0.2",
    "nanoid": "^5.1.6"
  }
}
```

### bin/artifact.js

```javascript
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Find the Bun binary
function findBun() {
  // 1. Check if @aspect-build/bun provides it
  try {
    const bunPkg = require.resolve('@aspect-build/bun');
    const bunDir = path.dirname(bunPkg);
    const bunBin = path.join(bunDir, 'bin', 'bun');
    if (fs.existsSync(bunBin)) return bunBin;
  } catch {}

  // 2. Check local .bun directory
  const localBun = path.join(__dirname, '..', '.bun', 'bin', 'bun');
  if (fs.existsSync(localBun)) return localBun;

  // 3. Fall back to global bun
  return 'bun';
}

const bunPath = findBun();
const entryPoint = path.join(__dirname, '..', 'index.ts');

const child = spawn(bunPath, ['run', entryPoint, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
```

## Alternative: Use @aspect-build/bun

The `@aspect-build/bun` package provides pre-built Bun binaries for all platforms. By depending on it, we get:
- Automatic platform-specific binary download via npm
- No postinstall script needed
- Reliable binary resolution

## Dependency Strategy

```
artifact-cli
├── @aspect-build/bun (provides Bun binary)
├── commander
└── nanoid
```

Note: TypeScript is only needed for development, not runtime (Bun handles TS natively).
