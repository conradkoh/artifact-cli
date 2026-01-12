import { Command } from 'commander';
import { OpenArtifactUseCase } from '../../domain/usecases/openArtifact';
import { FileArtifactRepository } from '../../infrastructure/repositories/FileArtifactRepository';
import { BunServerManager } from '../../infrastructure/services/BunServerManager';

export function openCommand(): Command {
  const cmd = new Command('open');

  cmd
    .description('Open an artifact preview in the browser (starts server if stopped)')
    .argument('<id>', 'Artifact ID')
    .action(async (id: string) => {
      try {
        const repository = new FileArtifactRepository();
        const serverManager = new BunServerManager();

        const useCase = new OpenArtifactUseCase(repository, serverManager);

        const result = await useCase.execute({ artifactId: id });

        if (!result.found) {
          console.log(`\n${result.message}\n`);
          process.exit(1);
        }

        if (result.serverStarted) {
          console.log('\n✓ Server started');
        }
        console.log(`✓ Opened artifact ${id} in browser`);
        console.log(`  URL: ${result.url}\n`);
      } catch (error) {
        console.error('\n✗ Failed to open artifact:');
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
