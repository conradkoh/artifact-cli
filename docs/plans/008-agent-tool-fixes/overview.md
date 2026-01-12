# Plan 008: Agent Tool Fixes

## Summary

Fix two critical bugs discovered during validation of the simplified agent interface (Plan 007):

1. **UTF-8 Encoding Bug** - `btoa()`/`atob()` fails on Unicode characters (emojis, special chars)
2. **Hot Reload Timeout Bug** - SSE connections drop after 10 seconds due to Bun.serve's default `idleTimeout`

These fixes ensure the agent tools work reliably for real-world component code.

## Goals

1. **Support Unicode in Component Code** - Agent can create artifacts with emojis and non-ASCII characters
2. **Reliable Hot Reload** - SSE connections stay alive indefinitely for hot reload to work
3. **Debug Logging** - Add console logging for SSE events to aid troubleshooting

## Non-Goals

1. **Feature Changes** - No new features, only bug fixes
2. **API Changes** - Tool signatures remain the same
3. **Breaking Changes** - Fully backwards compatible
