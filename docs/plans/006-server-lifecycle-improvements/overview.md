# Plan 006: Server Lifecycle Improvements

## Summary

Improve server lifecycle management based on user feedback. Remove auto-timeout in favor of explicit server management with `list` and `stop` commands.

## Goals

1. **Remove Auto-Timeout** - Servers run until explicitly stopped
2. **Add List Command** - `artifact list` shows all artifacts and server status
3. **Add Stop Command** - `artifact stop <id>` or `artifact stop --all` to stop servers
4. **Improve Tool Descriptions** - Enhance OpenCode tool descriptions with lifecycle info
5. **Temp Directory Storage** - Artifacts already stored in temp (confirmed, no changes needed)

## Non-Goals

1. **Configurable Timeouts** - Not implementing variable timeout options
2. **Auto-restart on Access** - Not implementing browser-triggered restart
3. **Status Command** - List command covers this need
