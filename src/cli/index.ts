import { Command } from 'commander';
import { createCommand } from './commands/create';
import { updateCommand } from './commands/update';
import { previewCommand } from './commands/preview';

const program = new Command();

program
  .name('artifact')
  .description('CLI tool for previewing React components in isolated sandboxes')
  .version('0.1.0');

program.addCommand(createCommand());
program.addCommand(updateCommand());
program.addCommand(previewCommand());

program.parse();
