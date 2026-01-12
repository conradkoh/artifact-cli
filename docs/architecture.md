# Artifact CLI - Architecture

## System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI Layer                                │
│  (Command parsing, argument validation, output formatting)      │
├─────────────────────────────────────────────────────────────────┤
│                       Domain Layer                              │
│  (Entities, Use Cases, Repository/Service interfaces)           │
│  CreateArtifact, UpdateArtifact, PreviewArtifact use cases      │
│                  ⚠️ NO EXTERNAL DEPENDENCIES                    │
├─────────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                          │
│  (File system, TypeScript compiler API, Server management)      │
│            Implements Domain interfaces                         │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Command
     │
     ▼
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ CLI Parser  │───▶│ Use Case Handler │───▶│ Domain Services │
└─────────────┘    └──────────────────┘    └─────────────────┘
                           │                       │
                           ▼                       ▼
                   ┌───────────────┐    ┌──────────────────┐
                   │ Server Manager│    │ Component Parser │
                   │ (spawn server)│    │ (TS AST parsing) │
                   └───────────────┘    └──────────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ Artifact Store│
                   │ (temp files)  │
                   └───────────────┘
```

## Design Patterns

| Pattern                  | Usage                                                            |
| ------------------------ | ---------------------------------------------------------------- |
| **Clean Architecture**   | Separation of concerns across CLI, Domain, Infrastructure layers |
| **Repository Pattern**   | Abstract storage operations for artifacts (`ArtifactRepository`) |
| **Dependency Injection** | Use cases receive dependencies via constructor for testability   |
| **Command Pattern**      | Each CLI command maps to a use case handler                      |
| **Factory Pattern**      | `ArtifactFactory` creates properly configured artifact instances |

## Folder Structure

```
artifact-cli/
├── src/
│   ├── cli/
│   │   ├── commands/           # CLI command definitions
│   │   │   ├── create.ts       # artifact create <file> | artifact create --code <base64>
│   │   │   ├── update.ts       # artifact update <id> [--code <base64>]
│   │   │   ├── preview.ts      # artifact preview <id>
│   │   │   ├── open.ts         # artifact open <id> (starts server if stopped)
│   │   │   ├── list.ts         # artifact list
│   │   │   ├── stop.ts         # artifact stop <id>
│   │   │   └── opencode.ts     # artifact opencode install (agent tools)
│   │   ├── output/             # Output formatters
│   │   │   └── formatter.ts
│   │   └── index.ts            # CLI entry point
│   │
│   ├── domain/
│   │   ├── entities/           # Core business entities
│   │   │   ├── Artifact.ts
│   │   │   └── ComponentAnalysis.ts
│   │   ├── usecases/           # Use case orchestration (business logic)
│   │   │   ├── createArtifact.ts
│   │   │   ├── updateArtifact.ts
│   │   │   ├── openArtifact.ts
│   │   │   ├── listArtifacts.ts
│   │   │   └── stopArtifact.ts
│   │   ├── repositories/       # Repository interfaces
│   │   │   └── ArtifactRepository.ts
│   │   └── services/           # Domain service interfaces
│   │       ├── ComponentParser.ts
│   │       └── ServerManager.ts
│   │
│   └── infrastructure/
│       ├── repositories/       # Repository implementations
│       │   └── FileArtifactRepository.ts
│       ├── server/             # Artifact server module
│       │   ├── index.ts        # Entry point (spawned per artifact)
│       │   └── artifactServer.ts  # Server implementation
│       ├── services/           # Service implementations
│       │   ├── TypeScriptComponentParser.ts
│       │   └── BunServerManager.ts
│       └── templates/          # Sandpack HTML template generator
│           └── sandpackTemplate.ts
│
├── docs/                       # Documentation
├── index.ts                    # Main entry point
├── package.json
└── tsconfig.json
```

## Temp Folder Structure

Artifacts are stored in the system temp directory with a clean separation of user data and runtime state:

```
{os.tmpdir()}/artifact-cli/
├── artifacts.json              # Artifact metadata (ID, port, component name, etc.)
└── artifacts/
    └── {artifactId}/
        ├── component.tsx       # User data (only persistent file!)
        └── .runtime/           # Ephemeral runtime state
            ├── server.pid      # Server process ID
            ├── server.log      # Server output log
            └── .reload         # Signal file for hot reload
```

**Key Design Decisions:**
- **Runtime from CLI**: Server code lives in CLI (`src/infrastructure/server/`), not copied per artifact
- **On-the-fly HTML**: Sandpack HTML is generated at request time, not stored
- **CLI Upgrades Apply Automatically**: Upgrading the CLI improves all existing artifacts
- **Clean Data**: Only `component.tsx` (user data) is stored; everything else is ephemeral

## Key Technologies

| Technology                       | Purpose                   | Justification                                    |
| -------------------------------- | ------------------------- | ------------------------------------------------ |
| **Bun**                          | Runtime & package manager | Fast startup, native TypeScript, built-in server |
| **TypeScript**                   | Language                  | Type safety, AST parsing via compiler API        |
| **@codesandbox/sandpack-react**  | Component preview         | In-browser bundling, React support, hot reload   |
| **Commander.js** (or Bun native) | CLI framework             | Mature, well-documented argument parsing         |

## Contracts

### Core Entities

```typescript
/**
 * Represents a single artifact instance with its associated server
 */
interface Artifact {
  id: string; // Unique identifier (e.g., "abc123")
  sourceFile: string | null; // Original file path (null for inline code)
  sourceCode: string | null; // Inline code content (for agent-created artifacts)
  componentName: string; // Exported component name
  tempDir: string; // Path to artifact directory in temp folder
  port: number; // Server port
  url: string; // Full URL (e.g., "http://localhost:3001/abc123")
  pid: number | null; // Server process ID (null if not running)
  status: ArtifactStatus; // Current status
  createdAt: Date;
  updatedAt: Date;
}

type ArtifactStatus = "starting" | "running" | "stopped" | "error";

/**
 * Result of parsing a React component file
 */
interface ComponentAnalysis {
  componentName: string; // Primary export name
  code: string; // Full component code
  dependencies: string[]; // npm packages imported
  localImports: LocalImport[]; // Relative imports to include
}

interface LocalImport {
  importPath: string; // Original import path
  resolvedPath: string; // Absolute file path
  code: string; // File contents
}
```

### Repository Interfaces

```typescript
/**
 * Abstracts artifact persistence operations
 */
interface ArtifactRepository {
  save(artifact: Artifact): Promise<void>;
  findById(id: string): Promise<Artifact | null>;
  findAll(): Promise<Artifact[]>;
  findBySourceFile(sourceFile: string): Promise<Artifact | null>;
  delete(id: string): Promise<void>;
}
```

### Service Interfaces

```typescript
/**
 * Parses React component files to extract metadata
 */
interface ComponentParser {
  analyze(filePath: string): Promise<ComponentAnalysis>;
}

/**
 * Manages artifact preview servers
 */
interface ServerManager {
  start(artifact: Artifact): Promise<{ pid: number; port: number }>;
  stop(artifact: Artifact): Promise<void>;
  reload(artifact: Artifact): Promise<void>;
  isRunning(artifact: Artifact): Promise<boolean>;
}
```

### Command Input/Output Types

```typescript
// CLI Command Inputs
interface CreateCommandInput {
  filePath?: string; // Path to React component file
  code?: string; // Or inline code (base64 encoded)
  name?: string; // Optional component name override
}

interface UpdateCommandInput {
  artifactId: string; // Artifact to update
  code?: string; // New code (base64 encoded)
}

interface OpenCommandInput {
  artifactId: string; // Artifact to open (starts server if stopped)
}

// CLI Command Outputs
interface CreateCommandOutput {
  artifact: Artifact;
  message: string;
  stopInstructions: string;
}

interface UpdateCommandOutput {
  artifact: Artifact;
  serverRestarted: boolean;
  message: string;
}

interface ListCommandOutput {
  artifacts: Artifact[];
}
```

### Agent Tools (OpenCode Integration)

The CLI exposes 3 tools for AI agents:

| Tool | Arguments | Returns |
|------|-----------|---------|
| `artifact-cli_create` | `code: string`, `name?: string` | Artifact ID, URL, stop instructions |
| `artifact-cli_update` | `id: string`, `code: string` | Success message with URL |
| `artifact-cli_open` | `id: string` | Opens browser, handles errors gracefully |

Agents pass component code directly (not file paths). Code is base64 encoded for transmission.
