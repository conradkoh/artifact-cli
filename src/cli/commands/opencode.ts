import { Command } from 'commander';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

function getOpencodeToolTemplate(): string {
  // Using string concatenation to avoid template literal escaping issues
  const backtick = '`';
  const dollar = '$';
  
  return `import { tool } from "@opencode-ai/plugin"

/**
 * artifact-cli OpenCode integration
 * 
 * This file provides 5 tools for OpenCode to create and manage
 * React component previews using artifact-cli.
 * 
 * Available tools:
 *   - artifact-cli_verify: Check if CLI is installed, provide installation instructions
 *   - artifact-cli_help: Show full CLI documentation
 *   - artifact-cli_create: Create a preview from React component code
 *   - artifact-cli_update: Update an existing preview with new code
 *   - artifact-cli_open: Open preview in browser
 * 
 * The CLI manages file storage, servers, and cleanup internally.
 * Pass component code directly - no file paths needed.
 */

export const verify = tool({
  description: ${backtick}Verify that artifact-cli is installed and available.

Call this first before using other artifact-cli tools to ensure the CLI is properly installed.

Returns:
- If installed: Version info and confirmation message
- If not installed: Installation instructions${backtick},
  args: {},
  async execute() {
    try {
      const result = await Bun.${dollar}${backtick}artifact --version${backtick}.text()
      return ${backtick}✓ artifact-cli is installed!

Version: ${dollar}{result.trim()}

You can now use the following tools:
- artifact-cli_create: Create a preview from React code
- artifact-cli_update: Update an existing preview
- artifact-cli_open: Open preview in browser
- artifact-cli_help: Show full documentation${backtick}
    } catch (error) {
      return ${backtick}✗ artifact-cli is NOT installed.

To install, run one of these commands:

  # Using Bun (recommended):
  bun install -g artifact-cli

  # Using npm:
  npm install -g artifact-cli

After installation, run this verify tool again to confirm.${backtick}
    }
  },
})

export const help = tool({
  description: ${backtick}Show full artifact-cli documentation and usage examples.

Use this to understand:
- All available CLI commands
- How to create, update, and manage artifacts
- Command options and arguments
- Usage examples${backtick},
  args: {},
  async execute() {
    try {
      const result = await Bun.${dollar}${backtick}artifact --help${backtick}.text()
      return ${backtick}artifact-cli Documentation
========================

${dollar}{result.trim()}

Quick Start (for agents)
------------------------
1. Create an artifact from React code:
   Use artifact-cli_create with your component code

2. Update with new code:
   Use artifact-cli_update with artifact ID and new code

3. Open in browser:
   Use artifact-cli_open with artifact ID

Understanding 'artifact list' Output
------------------------------------
The list command shows all artifacts with these columns:

| Column    | Description                                          |
|-----------|------------------------------------------------------|
| ID        | Unique artifact identifier (use for update/open)     |
| Component | Name of the React component                          |
| Status    | 'running' = server active, 'stopped' = server down   |
| Watchers  | Number of browser tabs viewing this artifact         |
| Location  | 'temp' = in temp folder, 'saved' = persisted to project |
| URL       | Preview URL (only works when status is 'running')    |

- Watchers = 0 means no one is viewing the preview
- Servers auto-shutdown after 30s with 0 watchers
- Use artifact-cli_open to restart a stopped server
- Saved artifacts persist across restarts and can be committed to git

Server Lifecycle
----------------
- Servers start automatically when you create/open an artifact
- Servers auto-shutdown 30 seconds after the last browser tab closes
- Use artifact-cli_open to restart a stopped server${backtick}
    } catch (error) {
      return ${backtick}Error running help command: ${dollar}{error}

artifact-cli may not be installed. Run artifact-cli_verify to check installation.${backtick}
    }
  },
})

export const create = tool({
  description: ${backtick}Create an artifact preview from React component code.

Pass the component code directly as a string. The CLI handles file storage internally.

How it works:
1. Writes your code to an internal temp directory
2. Parses the component and detects npm dependencies automatically
3. Creates a Sandpack environment with hot reload support
4. Starts a local server and returns the preview URL

Returns:
- Artifact ID: Use for update/open commands
- Preview URL: The browser URL for the preview
- Stop instructions: How to clean up servers when done

Note: Opening the preview is optional - do so based on context.${backtick},
  args: {
    code: tool.schema.string().describe("The React component code (TSX/JSX as a string)"),
    name: tool.schema.string().optional().describe("Optional component name (auto-detected if omitted)"),
  },
  async execute(args) {
    try {
      // Use Buffer for proper UTF-8 support (btoa fails on non-ASCII characters)
      const encoded = Buffer.from(args.code).toString('base64')
      const nameArg = args.name ? ${backtick} --name ${dollar}{args.name}${backtick} : ''
      const result = await Bun.${dollar}${backtick}artifact create --code ${dollar}{encoded}${dollar}{nameArg}${backtick}.text()
      return result.trim()
    } catch (error) {
      return ${backtick}Error creating artifact: ${dollar}{error}${backtick}
    }
  },
})

export const update = tool({
  description: ${backtick}Update an existing artifact with new component code.

Pass the updated code directly. The CLI handles:
- Writing the new code to the artifact's temp directory
- Regenerating the Sandpack environment
- Hot reloading (or restarting the server if it was stopped)

The tool returns when the preview is ready to view.${backtick},
  args: {
    id: tool.schema.string().describe("Artifact ID to update (e.g., a1b2c3)"),
    code: tool.schema.string().describe("The updated React component code"),
  },
  async execute(args) {
    try {
      // Use Buffer for proper UTF-8 support (btoa fails on non-ASCII characters)
      const encoded = Buffer.from(args.code).toString('base64')
      const result = await Bun.${dollar}${backtick}artifact update ${dollar}{args.id} --code ${dollar}{encoded}${backtick}.text()
      return result.trim()
    } catch (error) {
      return ${backtick}Error updating artifact: ${dollar}{error}${backtick}
    }
  },
})

export const open = tool({
  description: ${backtick}Open an artifact preview in the browser.

Handles all cases:
- If artifact exists and server is running: opens browser immediately
- If artifact exists but server stopped: starts server, then opens browser
- If artifact not found: returns helpful error message

Use this to revisit previous artifacts or open a newly created one.${backtick},
  args: {
    id: tool.schema.string().describe("Artifact ID to open (e.g., a1b2c3)"),
  },
  async execute(args) {
    try {
      const result = await Bun.${dollar}${backtick}artifact open ${dollar}{args.id}${backtick}.text()
      return result.trim()
    } catch (error) {
      return ${backtick}Error opening artifact: ${dollar}{error}${backtick}
    }
  },
})
`;
}

export function opencodeCommand(): Command {
  const cmd = new Command('opencode');

  cmd.description('OpenCode integration commands');

  cmd
    .command('install')
    .description('Install artifact-cli as an OpenCode custom tool')
    .action(async () => {
      try {
        const home = homedir();
        const toolDir = join(home, '.config', 'opencode', 'tool');
        const toolFile = join(toolDir, 'artifact-cli.ts');

        // Create directory if it doesn't exist
        if (!existsSync(toolDir)) {
          mkdirSync(toolDir, { recursive: true });
        }

        // Write the tool definition
        writeFileSync(toolFile, getOpencodeToolTemplate());

        console.log('\n✓ OpenCode tool installed successfully!');
        console.log(`  Location: ~/.config/opencode/tool/artifact-cli.ts`);
        console.log('\n  Available tools:');
        console.log('    - artifact-cli_verify: Check if CLI is installed');
        console.log('    - artifact-cli_help: Show full CLI documentation');
        console.log('    - artifact-cli_create: Create a preview from React component code');
        console.log('    - artifact-cli_update: Update an existing preview with new code');
        console.log('    - artifact-cli_open: Open preview in browser');
        console.log('\n  Note: Restart OpenCode to load the new tool.\n');
      } catch (error) {
        console.error('\n✗ Failed to install OpenCode tool:');
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
