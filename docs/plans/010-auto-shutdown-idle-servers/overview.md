# Plan 010: Auto-Shutdown Idle Servers

## Summary

Automatically shut down artifact servers when no clients are watching the preview. This saves system resources (ports, memory, CPU) by stopping servers that have no active viewers.

## Current State

Currently, artifact servers run indefinitely until manually stopped with `artifact stop`. Even if the user closes their browser tab, the server continues running and consuming resources.

## Proposed Change

Track connected SSE clients (browser tabs viewing the preview). When the last client disconnects:
1. Start an idle timer (configurable, default ~30 seconds)
2. If no new clients connect before the timer expires, gracefully shutdown the server
3. If a client reconnects, cancel the timer

This leverages the existing SSE connection for hot reload - we already track clients in a `Set<ReadableStreamDefaultController>`.

## Goals

1. **Resource Efficiency** - Automatically free up ports and memory when previews aren't being viewed
2. **Seamless UX** - Users don't notice the shutdown; `artifact open` restarts the server transparently
3. **Configurable Grace Period** - Allow users to tune the idle timeout (or disable it)
4. **Logging** - Log shutdown events for debugging

## Non-Goals

1. **Persistent Sessions** - We're not trying to maintain state across shutdowns
2. **Multiple Artifact Consolidation** - This doesn't merge servers; each artifact still gets its own
3. **Remote Notification** - We don't notify the CLI when servers shutdown (the metadata just becomes stale, `artifact open` handles it)
