# artifact-cli

A CLI tool for previewing React components in isolated sandboxed environments using [Sandpack](https://sandpack.codesandbox.io/).

## Features

- 🚀 **Instant Previews** - Preview any React component with a single command
- 🔄 **Hot Reload** - Update previews without restarting the server
- 🎯 **Isolation** - Each artifact runs in its own server instance
- 📦 **Auto Dependency Detection** - Parses imports and includes them automatically
- 🖥️ **Full Screen UI** - Tabbed interface with Code and Preview views
- ⚡ **Zero Config** - Works out of the box with npx

## Installation

### Via npx (no installation required)

```bash
npx artifact-cli create ./src/components/Button.tsx
```

### Global Installation

```bash
npm install -g artifact-cli
artifact create ./src/components/Button.tsx
```

### Local Development

```bash
bun install
bun run index.ts create ./src/components/Button.tsx
```

## Usage

### Create an Artifact

Generate a preview from a React component file:

```bash
artifact create ./src/components/Button.tsx
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
artifact update <artifact-id>
```

### Preview an Artifact

Open the artifact URL in your default browser:

```bash
artifact preview <artifact-id>
```

### List Artifacts

See all artifacts and their server status:

```bash
artifact list
```

Output:

```
Artifacts:

  ID        Component           Status      URL
  ----------------------------------------------------------------------
  a1b2c3    Button              running     http://localhost:3001/a1b2c3
  d4e5f6    Card                stopped     http://localhost:3002/d4e5f6
```

### Stop Servers

Stop a single server:

```bash
artifact stop <artifact-id>
```

Stop all running servers:

```bash
artifact stop --all
```

## Example

```bash
# Create a preview of a Button component
artifact create ./src/Button.tsx

# After making changes, update the preview
artifact update a1b2c3

# Open it in the browser
artifact preview a1b2c3
```

## OpenCode Integration

Install artifact-cli as a custom tool for [OpenCode](https://opencode.ai):

```bash
artifact opencode install
```

This creates tools that OpenCode's LLM can call:
- `artifact-cli_create` - Create a preview from a React component
- `artifact-cli_update` - Update an existing preview  
- `artifact-cli_preview` - Open preview in browser
- `artifact-cli_list` - List all artifacts and status
- `artifact-cli_stop` - Stop server(s)

## Preview UI

The preview interface features:

- **Header** - Shows component name and status indicator
- **Code Tab** - Full-screen code editor with file tabs
- **Preview Tab** - Full-screen rendered component

## How It Works

1. **Parse** - The CLI parses your React component and detects dependencies
2. **Generate** - Creates a Sandpack configuration in a temp directory
3. **Serve** - Starts an isolated server for the preview
4. **Preview** - Opens the component in your browser

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
- [Plan 003: NPM Distribution](docs/plans/003-npm-distribution/)
- [Plan 004: Artifact URL & Timeout](docs/plans/004-artifact-url-and-timeout/)
- [Plan 005: OpenCode Integration](docs/plans/005-opencode-integration/)
- [Plan 006: Server Lifecycle Improvements](docs/plans/006-server-lifecycle-improvements/)

## Requirements

- Node.js 18+ (for npx/npm usage)
- Or [Bun](https://bun.sh) v1.0+ (for local development)

## License

MIT
