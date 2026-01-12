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
│   │   │   ├── create.ts       # artifact create <file>
│   │   │   ├── update.ts       # artifact update <id> <file>
│   │   │   ├── preview.ts      # artifact preview <id>
│   │   │   ├── list.ts         # artifact list
│   │   │   └── stop.ts         # artifact stop <id>
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
│   │   │   ├── previewArtifact.ts
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
│       ├── services/           # Service implementations
│       │   ├── TypeScriptComponentParser.ts
│       │   └── BunServerManager.ts
│       └── templates/          # Sandpack configuration templates
│           └── sandpackTemplate.ts
│
├── docs/                       # Documentation
├── index.ts                    # Main entry point
├── package.json
└── tsconfig.json
```

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
  sourceFile: string; // Absolute path to source component
  componentName: string; // Exported component name
  tempDir: string; // Path to generated files in temp directory
  port: number; // Server port
  url: string; // Full URL (e.g., "http://localhost:3001")
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
  filePath: string; // Path to React component file
}

interface UpdateCommandInput {
  artifactId: string; // Artifact to update
  filePath?: string; // Optional new file path
}

interface PreviewCommandInput {
  artifactId: string; // Artifact to preview
}

// CLI Command Outputs
interface CreateCommandOutput {
  artifact: Artifact;
  message: string;
}

interface ListCommandOutput {
  artifacts: Artifact[];
}
```
