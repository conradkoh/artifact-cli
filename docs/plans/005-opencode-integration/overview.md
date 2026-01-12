# Plan 005: OpenCode Integration

## Summary

Add an `artifact opencode install` command that installs artifact-cli as a custom tool for [OpenCode](https://opencode.ai). This allows OpenCode's LLM to call artifact-cli commands directly during conversations.

## Goals

1. **Install Command** - `artifact opencode install` creates the tool definition file
2. **Proper Location** - Tool installed to `~/.config/opencode/tool/artifact-cli.ts`
3. **OpenCode Convention** - Follow OpenCode's custom tool structure using `@opencode-ai/plugin`
4. **All Commands Exposed** - Expose create, update, and preview as callable tools

## Non-Goals

1. **Uninstall Command** - Not in scope for now
2. **Project-level Installation** - Only global installation for now
3. **OpenCode Configuration** - User manages their own OpenCode setup
