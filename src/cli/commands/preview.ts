import { Command } from 'commander';
import { PreviewArtifactUseCase } from '../../domain/usecases/previewArtifact';
import { FileArtifactRepository } from '../../infrastructure/repositories/FileArtifactRepository';
import { BunServerManager } from '../../infrastructure/services/BunServerManager';

export function previewCommand(): Command {
  const cmd = new Command('preview');

  cmd
    .description('Open an artifact in the browser')
    .argument('<id>', 'Artifact ID')
    .action(async (id: string) => {
      try {
        const repository = new FileArtifactRepository();
        const serverManager = new BunServerManager();

        const useCase = new PreviewArtifactUseCase(repository, serverManager);

        const { url } = await useCase.execute({ artifactId: id });

        console.log(`\n✓ Opening ${url} in browser...\n`);
      } catch (error) {
        console.error('\n✗ Failed to preview artifact:');
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
