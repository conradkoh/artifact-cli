import { Command } from 'commander';
import { CreateArtifactUseCase } from '../../domain/usecases/createArtifact';
import { FileArtifactRepository } from '../../infrastructure/repositories/FileArtifactRepository';
import { TypeScriptComponentParser } from '../../infrastructure/services/TypeScriptComponentParser';
import { BunServerManager } from '../../infrastructure/services/BunServerManager';

export function createCommand(): Command {
  const cmd = new Command('create');

  cmd
    .description('Create a new artifact from a React component')
    .argument('<file>', 'Path to the React component file')
    .action(async (file: string) => {
      try {
        const repository = new FileArtifactRepository();
        const parser = new TypeScriptComponentParser();
        const serverManager = new BunServerManager();

        const useCase = new CreateArtifactUseCase(
          repository,
          parser,
          serverManager
        );

        const { artifact } = await useCase.execute({ filePath: file });

        console.log('\n✓ Artifact created successfully!');
        console.log(`  ID:  ${artifact.id}`);
        console.log(`  URL: ${artifact.url}`);
        console.log(`\n  To update: artifact update ${artifact.id}`);
        console.log(`  To preview: artifact preview ${artifact.id}\n`);
      } catch (error) {
        console.error('\n✗ Failed to create artifact:');
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
