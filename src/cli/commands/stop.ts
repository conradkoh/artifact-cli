import { Command } from 'commander';
import { FileArtifactRepository } from '../../infrastructure/repositories/FileArtifactRepository';
import { BunServerManager } from '../../infrastructure/services/BunServerManager';

export function stopCommand(): Command {
  const cmd = new Command('stop');

  cmd
    .description('Stop artifact server(s)')
    .argument('[id]', 'Artifact ID to stop (omit if using --all)')
    .option('-a, --all', 'Stop all running servers')
    .action(async (id: string | undefined, options: { all?: boolean }) => {
      try {
        const repository = new FileArtifactRepository();
        const serverManager = new BunServerManager();

        if (options.all) {
          // Stop all running servers
          const artifacts = await repository.findAll();
          let stoppedCount = 0;

          for (const artifact of artifacts) {
            const isRunning = await serverManager.isRunning(artifact);
            if (isRunning) {
              await serverManager.stop(artifact);
              artifact.status = 'stopped';
              artifact.updatedAt = new Date();
              await repository.save(artifact);
              stoppedCount++;
            }
          }

          if (stoppedCount === 0) {
            console.log('\nNo running servers to stop.\n');
          } else {
            console.log(`\n✓ Stopped ${stoppedCount} running server${stoppedCount > 1 ? 's' : ''}\n`);
          }
          return;
        }

        if (!id) {
          console.error('\n✗ Please provide an artifact ID or use --all\n');
          console.log('  Usage: artifact stop <id>');
          console.log('         artifact stop --all\n');
          process.exit(1);
        }

        // Stop single artifact
        const artifact = await repository.findById(id);

        if (!artifact) {
          console.error(`\n✗ Artifact not found: ${id}\n`);
          process.exit(1);
        }

        const isRunning = await serverManager.isRunning(artifact);

        if (!isRunning) {
          console.log(`\n✓ Server already stopped for artifact ${id}\n`);
          return;
        }

        await serverManager.stop(artifact);
        artifact.status = 'stopped';
        artifact.updatedAt = new Date();
        await repository.save(artifact);

        console.log(`\n✓ Server stopped for artifact ${id}\n`);
      } catch (error) {
        console.error('\n✗ Failed to stop server:');
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
