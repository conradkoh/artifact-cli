# Plan 003: NPM Distribution

## Summary

Package artifact-cli for distribution via npm, enabling users to run it via:
- `npx artifact-cli <command>` - One-time execution without installation
- `npm install -g artifact-cli && artifact <command>` - Global installation

The package will bundle Bun as a dependency to ensure a seamless user experience without requiring users to install Bun separately.

## Goals

1. **NPX Support** - Users can run `npx artifact-cli create ./Component.tsx` without prior installation
2. **Global Installation** - Users can install globally and use `artifact` command
3. **Bundled Bun** - Ship with Bun runtime so users don't need to install it separately
4. **Cross-Platform** - Support macOS, Linux, and Windows
5. **Seamless Experience** - No additional setup required after npm install

## Non-Goals

1. **Homebrew/apt Distribution** - Focus on npm only for now
2. **Docker Distribution** - Not in scope
3. **Self-Update Mechanism** - Users update via npm
