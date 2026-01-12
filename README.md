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

This creates 5 tools that OpenCode's LLM can call:

| Tool | Description |
|------|-------------|
| `artifact-cli_verify` | Check if CLI is installed, provide installation instructions if not. |
| `artifact-cli_help` | Show full CLI documentation and usage examples. |
| `artifact-cli_create` | Create an artifact from inline React code. Returns artifact ID and URL. |
| `artifact-cli_update` | Update artifact code and hot reload the preview. |
| `artifact-cli_open` | Open artifact in browser (starts server if stopped). |

**How it works with agents:**
1. Agent calls `verify` to check if artifact-cli is installed
2. Agent calls `create` with React component code → Gets artifact ID and URL
3. Agent calls `update` with new code → Preview hot reloads automatically  
4. Agent calls `open` to show the preview in browser (optional)

The agent passes component code directly (not file paths), and all files are managed in a temp directory transparently.

## Preview UI

The preview interface features:

- **Header** - Shows component name and status indicator
- **Code Tab** - Full-screen code editor with file tabs
- **Preview Tab** - Full-screen rendered component

## How It Works

1. **Parse** - The CLI parses your React component and detects dependencies
2. **Store** - Saves component code to a temp directory (only user data stored)
3. **Serve** - Starts an isolated server that generates Sandpack HTML on-the-fly
4. **Preview** - Opens the component in your browser

### Architecture Highlights

- **Runtime from CLI** - Server and wrapper code live in the CLI, not copied to temp folder
- **On-the-fly Generation** - HTML is generated at request time, not stored
- **CLI Upgrades Apply Automatically** - Upgrading the CLI improves all existing artifacts
- **Clean Data Separation** - Temp folder only contains your component code

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
    ├── server/             # Artifact server module (spawned per artifact)
    ├── services/           # TypeScript parser, server manager
    └── templates/          # Sandpack HTML template generator
```

### Temp Folder Structure

```
{tmpdir}/artifact-cli/
├── artifacts.json          # Artifact metadata
└── artifacts/
    └── {id}/
        ├── component.tsx   # User data (only this is persistent!)
        └── .runtime/       # Ephemeral runtime state
            ├── server.pid
            └── server.log
```

## Documentation

- [Project Overview](docs/overview.md)
- [Architecture](docs/architecture.md)

## Requirements

- Node.js 18+ (for npx/npm usage)
- Or [Bun](https://bun.sh) v1.0+ (for local development)

## License

MIT
