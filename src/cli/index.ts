import { Command } from 'commander';
import { createCommand } from './commands/create';
import { updateCommand } from './commands/update';
import { previewCommand } from './commands/preview';
import { openCommand } from './commands/open';
import { listCommand } from './commands/list';
import { stopCommand } from './commands/stop';
import { cleanCommand } from './commands/clean';
import { saveCommand } from './commands/save';
import { unsaveCommand } from './commands/unsave';
import { opencodeCommand } from './commands/opencode';

const program = new Command();

program
  .name('artifact')
  .description('CLI tool for previewing React components in isolated sandboxes')
  .version('0.1.0');

program.addCommand(createCommand());
program.addCommand(updateCommand());
program.addCommand(previewCommand());  // Keep for backwards compatibility
program.addCommand(openCommand());      // New preferred command
program.addCommand(listCommand());
program.addCommand(stopCommand());
program.addCommand(cleanCommand());
program.addCommand(saveCommand());
program.addCommand(unsaveCommand());
program.addCommand(opencodeCommand());

program.parse();
