# Artifact CLI - Overview

## Summary

**artifact-cli** is a command-line tool for previewing React components in isolated sandboxed environments. It enables developers to quickly spin up interactive previews of React components using [Sandpack](https://sandpack.codesandbox.io/) (the in-browser bundler powering CodeSandbox).

The CLI analyzes React component files, extracts the necessary code and dependencies via TypeScript AST parsing, generates a sandpack-based preview server, and provides a local URL for viewing the component in the browser.

## Goals

1. **Rapid Component Previewing** - Enable developers to preview any React component with a single command
2. **Isolation** - Each artifact runs in its own server instance for complete isolation
3. **Hot Reload** - Support updating artifacts without restarting the server
4. **Developer Experience** - Minimal configuration, sensible defaults, and clear output
5. **Persistence** - Artifacts persist across CLI invocations with unique identifiers for updates

## Non-Goals

1. **Production Deployment** - This is a development/preview tool, not a production server
2. **Full Application Bundling** - We only preview components, not full applications
3. **Multi-framework Support** - Initial scope is React only
4. **Remote Sharing** - No tunneling or remote URL sharing (local development only)
5. **Component Library Management** - This is not a component library or documentation tool

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| Create Artifact | ✅ Done | Generate sandpack preview from React component file or inline code |
| Update Artifact | ✅ Done | Hot reload an existing artifact with updated code |
| Open Artifact | ✅ Done | Open artifact URL in default browser (auto-starts server if stopped) |
| List Artifacts | ✅ Done | Show all artifacts with status, watchers, and location |
| Stop Artifact | ✅ Done | Stop a running artifact server |
| Clean Artifacts | ✅ Done | Remove stopped artifacts and their data |
| Save/Unsave | ✅ Done | Persist artifacts to project directory for version control |
| Auto-Shutdown | ✅ Done | Servers auto-shutdown after 30s with no active watchers |
| OpenCode Integration | ✅ Done | 5 agent-facing tools: verify, help, create, update, open |
| Runtime Separation | ✅ Done | CLI upgrades apply automatically to all artifacts |
