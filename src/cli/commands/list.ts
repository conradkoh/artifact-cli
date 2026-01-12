import { Command } from 'commander';
import { FileArtifactRepository } from '../../infrastructure/repositories/FileArtifactRepository';
import { BunServerManager } from '../../infrastructure/services/BunServerManager';

export function listCommand(): Command {
  const cmd = new Command('list');

  cmd
    .description('List all artifacts and their status')
    .action(async () => {
      try {
        const repository = new FileArtifactRepository();
        const serverManager = new BunServerManager();

        const artifacts = await repository.findAll();

        if (artifacts.length === 0) {
          console.log('\nNo artifacts found.\n');
          console.log('  Create one with: artifact create <file>\n');
          return;
        }

        console.log('\nArtifacts:\n');
        console.log(
          '  ' +
            'ID'.padEnd(10) +
            'Component'.padEnd(20) +
            'Status'.padEnd(12) +
            'URL'
        );
        console.log('  ' + '-'.repeat(70));

        for (const artifact of artifacts) {
          const isRunning = await serverManager.isRunning(artifact);
          const status = isRunning ? 'running' : 'stopped';
          const statusColor = isRunning ? '\x1b[32m' : '\x1b[90m'; // green or gray
          const reset = '\x1b[0m';

          console.log(
            '  ' +
              artifact.id.padEnd(10) +
              artifact.componentName.padEnd(20) +
              statusColor +
              status.padEnd(12) +
              reset +
              artifact.url
          );
        }

        console.log('');
      } catch (error) {
        console.error('\n✗ Failed to list artifacts:');
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
