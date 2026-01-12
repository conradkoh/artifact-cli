# artifact-cli

A CLI tool for previewing React components in isolated sandboxed environments using [Sandpack](https://sandpack.codesandbox.io/).

## Features

- 🚀 **Instant Previews** - Preview any React component with a single command
- 🔄 **Hot Reload** - Update previews without restarting the server
- 🎯 **Isolation** - Each artifact runs in its own server instance
- 📦 **Auto Dependency Detection** - Parses imports and includes them automatically
- 🖥️ **Full Screen UI** - Tabbed interface with Code and Preview views

## Installation

```bash
bun install
```

## Usage

### Create an Artifact

Generate a preview from a React component file:

```bash
bun run index.ts create ./src/components/Button.tsx
```

Output:
```
✓ Artifact created successfully!
  ID:  a1b2c3
  URL: http://localhost:3001

  To update: artifact update a1b2c3
  To preview: artifact preview a1b2c3
```

### Update an Artifact

After modifying your component, update the preview:

```bash
bun run index.ts update <artifact-id>
```

### Preview an Artifact

Open the artifact URL in your default browser:

```bash
bun run index.ts preview <artifact-id>
```

## Example

```bash
# Create a preview of the example Button component
bun run index.ts create examples/Button.tsx

# Open it in the browser
bun run index.ts preview <artifact-id>
```

## Preview UI

The preview interface features:

- **Header** - Shows component name and status indicator
- **Code Tab** - Full-screen code editor with file tabs
- **Preview Tab** - Full-screen rendered component

## Architecture

This project follows Clean Architecture principles:

```
src/
├── cli/                    # CLI commands (Presentation layer)
├── domain/
│   ├── entities/           # Core business entities
│   ├── usecases/           # Business logic orchestration
│   ├── repositories/       # Repository interfaces
│   └── services/           # Service interfaces
└── infrastructure/         # External implementations
    ├── repositories/       # File-based storage
    ├── services/           # TypeScript parser, Bun server
    └── templates/          # Sandpack HTML template
```

## Documentation

- [Project Overview](docs/overview.md)
- [Architecture](docs/architecture.md)
- [Plan 001: Foundation](docs/plans/001-foundation/)
- [Plan 002: UI Improvements](docs/plans/002-preview-ui-improvements/)

## Requirements

- [Bun](https://bun.sh) v1.0+

## License

MIT
