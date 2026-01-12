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
 * This file provides custom tools for OpenCode to create and manage
 * React component previews using artifact-cli.
 * 
 * Available tools:
 *   - artifact-cli_create: Create a preview from a React component
 *   - artifact-cli_update: Update an existing preview
 *   - artifact-cli_preview: Open preview in browser
 *   - artifact-cli_list: List all artifacts and their status
 *   - artifact-cli_stop: Stop artifact server(s)
 */

export const create = tool({
  description: ${backtick}Create an artifact preview from a React component using Sandpack.

How it works:
- Parses your component and detects npm dependencies automatically (Three.js, Framer Motion, etc.)
- Creates a Sandpack environment with hot reload support
- Starts a local server that runs until stopped with 'artifact stop <id>'

Requirements:
- File path can be relative or absolute
- Must be a React component file (.tsx/.jsx)
- Local TypeScript errors are OK - Sandpack handles compilation independently

Returns:
- Artifact ID: Use for update/preview/stop commands
- Preview URL: Open in browser to see the component

Note: Servers run until explicitly stopped. Use 'artifact list' to see running servers.${backtick},
  args: {
    file: tool.schema.string().describe("Path to the React component file (e.g., ./src/Button.tsx)"),
  },
  async execute(args) {
    try {
      const result = await Bun.${dollar}${backtick}artifact create ${dollar}{args.file}${backtick}.text()
      return result.trim()
    } catch (error) {
      return ${backtick}Error creating artifact: ${dollar}{error}${backtick}
    }
  },
})

export const update = tool({
  description: ${backtick}Update an existing artifact with the latest code changes.

What it does:
- Re-parses the source file and regenerates the Sandpack environment
- Triggers hot reload if server is running
- Restarts the server if it was stopped (preserves the same URL if possible)

When to use:
- After modifying the source component file
- To restart a stopped server
- After adding new dependencies to the component${backtick},
  args: {
    id: tool.schema.string().describe("Artifact ID to update (e.g., a1b2c3)"),
  },
  async execute(args) {
    try {
      const result = await Bun.${dollar}${backtick}artifact update ${dollar}{args.id}${backtick}.text()
      return result.trim()
    } catch (error) {
      return ${backtick}Error updating artifact: ${dollar}{error}${backtick}
    }
  },
})

export const preview = tool({
  description: ${backtick}Open an artifact preview in the default browser.

What it does:
- Opens the artifact URL using the system default browser
- Fails if the server is stopped

If preview fails:
- Use 'artifact list' to check if server is running
- Use 'artifact update <id>' to restart a stopped server${backtick},
  args: {
    id: tool.schema.string().describe("Artifact ID to preview (e.g., a1b2c3)"),
  },
  async execute(args) {
    try {
      const result = await Bun.${dollar}${backtick}artifact preview ${dollar}{args.id}${backtick}.text()
      return result.trim()
    } catch (error) {
      return ${backtick}Error previewing artifact: ${dollar}{error}${backtick}
    }
  },
})

export const list = tool({
  description: ${backtick}List all artifacts and their server status.

Shows:
- Artifact ID
- Component name
- Status (running/stopped)
- Preview URL

Use this to check which servers are running before stopping them.${backtick},
  args: {},
  async execute() {
    try {
      const result = await Bun.${dollar}${backtick}artifact list${backtick}.text()
      return result.trim()
    } catch (error) {
      return ${backtick}Error listing artifacts: ${dollar}{error}${backtick}
    }
  },
})

export const stop = tool({
  description: ${backtick}Stop artifact server(s) to free up resources.

Usage:
- Stop single server: provide the artifact ID
- Stop all servers: set all to true

Stopped servers can be restarted with 'artifact update <id>'.${backtick},
  args: {
    id: tool.schema.string().optional().describe("Artifact ID to stop (omit if stopping all)"),
    all: tool.schema.boolean().optional().describe("Set to true to stop all running servers"),
  },
  async execute(args) {
    try {
      if (args.all) {
        const result = await Bun.${dollar}${backtick}artifact stop --all${backtick}.text()
        return result.trim()
      }
      if (!args.id) {
        return "Error: Please provide an artifact ID or set all: true"
      }
      const result = await Bun.${dollar}${backtick}artifact stop ${dollar}{args.id}${backtick}.text()
      return result.trim()
    } catch (error) {
      return ${backtick}Error stopping artifact: ${dollar}{error}${backtick}
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
        console.log('    - artifact-cli_create: Create a preview from a React component');
        console.log('    - artifact-cli_update: Update an existing preview');
        console.log('    - artifact-cli_preview: Open preview in browser');
        console.log('    - artifact-cli_list: List all artifacts and status');
        console.log('    - artifact-cli_stop: Stop server(s)');
        console.log('\n  Note: Restart OpenCode to load the new tool.\n');
      } catch (error) {
        console.error('\n✗ Failed to install OpenCode tool:');
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
