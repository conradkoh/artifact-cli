import { Command } from 'commander';
import { UpdateArtifactUseCase } from '../../domain/usecases/updateArtifact';
import { FileArtifactRepository } from '../../infrastructure/repositories/FileArtifactRepository';
import { TypeScriptComponentParser } from '../../infrastructure/services/TypeScriptComponentParser';
import { BunServerManager } from '../../infrastructure/services/BunServerManager';

export function updateCommand(): Command {
  const cmd = new Command('update');

  cmd
    .description('Update an existing artifact with latest code')
    .argument('<id>', 'Artifact ID')
    .action(async (id: string) => {
      try {
        const repository = new FileArtifactRepository();
        const parser = new TypeScriptComponentParser();
        const serverManager = new BunServerManager();

        const useCase = new UpdateArtifactUseCase(
          repository,
          parser,
          serverManager
        );

        const { artifact, serverRestarted } = await useCase.execute({ artifactId: id });

        if (serverRestarted) {
          console.log('\n✓ Artifact server restarted');
        }
        console.log('✓ Artifact updated!');
        console.log(`  ID:  ${artifact.id}`);
        console.log(`  URL: ${artifact.url}\n`);
      } catch (error) {
        console.error('\n✗ Failed to update artifact:');
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
