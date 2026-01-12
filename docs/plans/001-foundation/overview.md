# Plan 001: Foundation

## Summary

Establish the foundational CLI structure for artifact-cli with three core commands:
1. **Create** - Generate and serve a React component preview
2. **Update** - Hot reload an existing artifact with updated code
3. **Preview** - Open an artifact URL in the browser

This plan sets up the complete project architecture, including TypeScript AST parsing for component analysis, Sandpack-based preview servers, and artifact state management.

## Goals

1. **Working Create Command** - Parse a React component file, generate sandpack configuration, start an isolated server, and return a URL
2. **Working Update Command** - Update an existing artifact's code and trigger hot reload
3. **Working Preview Command** - Open the artifact URL in the system's default browser
4. **Artifact Persistence** - Store artifact metadata for session continuity
5. **Clean Architecture** - Establish patterns for future extensibility

## Non-Goals

1. **List/Stop Commands** - Deferred to a future plan
2. **Complex Component Graphs** - Initial version handles simple component trees (1-2 levels deep)
3. **Custom Sandpack Themes** - Use default styling
4. **Authentication/Security** - Local development only, no auth needed
5. **Cross-platform Testing** - Focus on macOS initially (using `open` command)
