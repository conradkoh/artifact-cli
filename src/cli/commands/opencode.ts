import { Command } from 'commander';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const OPENCODE_TOOL_TEMPLATE = `import { tool } from "@opencode-ai/plugin"

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
 */

export const create = tool({
  description: "Create an artifact preview from a React component file. Returns the artifact ID and preview URL.",
  args: {
    file: tool.schema.string().describe("Path to the React component file (e.g., ./src/Button.tsx)"),
  },
  async execute(args) {
    try {
      const result = await Bun.$\`artifact create \${args.file}\`.text()
      return result.trim()
    } catch (error) {
      return \`Error creating artifact: \${error}\`
    }
  },
})

export const update = tool({
  description: "Update an existing artifact with the latest code changes. The server will auto-restart if it was stopped.",
  args: {
    id: tool.schema.string().describe("Artifact ID to update (e.g., a1b2c3)"),
  },
  async execute(args) {
    try {
      const result = await Bun.$\`artifact update \${args.id}\`.text()
      return result.trim()
    } catch (error) {
      return \`Error updating artifact: \${error}\`
    }
  },
})

export const preview = tool({
  description: "Open an artifact preview in the default browser",
  args: {
    id: tool.schema.string().describe("Artifact ID to preview (e.g., a1b2c3)"),
  },
  async execute(args) {
    try {
      const result = await Bun.$\`artifact preview \${args.id}\`.text()
      return result.trim()
    } catch (error) {
      return \`Error previewing artifact: \${error}\`
    }
  },
})
`;

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
        writeFileSync(toolFile, OPENCODE_TOOL_TEMPLATE);

        console.log('\n✓ OpenCode tool installed successfully!');
        console.log(`  Location: ~/.config/opencode/tool/artifact-cli.ts`);
        console.log('\n  Available tools:');
        console.log('    - artifact-cli_create: Create a preview from a React component');
        console.log('    - artifact-cli_update: Update an existing preview');
        console.log('    - artifact-cli_preview: Open preview in browser');
        console.log('\n  Note: Restart OpenCode to load the new tool.\n');
      } catch (error) {
        console.error('\n✗ Failed to install OpenCode tool:');
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
