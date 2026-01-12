# Plan 002: Preview UI Improvements - Architecture

## Changes Overview

| Component | Type | Description |
|-----------|------|-------------|
| Sandpack Template | Modified | Update layout to full screen with custom tab navigation |
| CSS Styles | Modified | Add styles for tabs and full-screen layout |

## Modified Components

### Sandpack Template (`src/infrastructure/templates/sandpackTemplate.ts`)

**Current Behavior:**
- Sandpack renders with default layout (editor + preview side by side or stacked)
- "Open Sandbox" button visible in preview area
- Component name header at top

**New Behavior:**
- Custom tab bar with "Code" and "Preview" tabs
- Only one panel visible at a time based on selected tab
- No "Open Sandbox" button
- Full viewport height layout

**Implementation Approach:**

Instead of using Sandpack's built-in layout, we'll use Sandpack's individual components:
- `SandpackProvider` - Context provider for Sandpack state
- `SandpackCodeEditor` - Code editor component (for Code tab)
- `SandpackPreview` - Preview component (for Preview tab)
- `SandpackFileExplorer` or custom file tabs

This gives us full control over the layout while still using Sandpack's bundling.

## UI Layout

```
┌──────────────────────────────────────────────────────┐
│  ● Button        [ Code ]  [ Preview ]               │  <- Header with component name + tabs
├──────────────────────────────────────────────────────┤
│                                                      │
│                                                      │
│              Tab Content (full height)               │
│                                                      │
│    Code Tab: Shows editor with file tabs             │
│    Preview Tab: Shows rendered component             │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Sandpack Configuration Changes

```typescript
// Key Sandpack options to hide Open Sandbox button
options: {
  showOpenInCodeSandbox: false,  // Hides the "Open Sandbox" button
}
```

## New Contracts

No new contracts - this is a UI-only change to the template.
