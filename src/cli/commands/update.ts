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
    .option('--code <code>', 'Base64-encoded component code (for agent use)')
    .action(async (id: string, options: { code?: string }) => {
      try {
        const repository = new FileArtifactRepository();
        const parser = new TypeScriptComponentParser();
        const serverManager = new BunServerManager();

        const useCase = new UpdateArtifactUseCase(
          repository,
          parser,
          serverManager
        );

        // Decode base64 code if provided (using Buffer for UTF-8 support)
        let code: string | undefined;
        if (options.code) {
          try {
            code = Buffer.from(options.code, 'base64').toString('utf-8');
          } catch {
            console.error('\n✗ Error: Invalid base64-encoded code\n');
            process.exit(1);
          }
        }

        const { artifact, serverRestarted, message } = await useCase.execute({
          artifactId: id,
          code,
        });

        if (serverRestarted) {
          console.log('\n✓ Artifact server restarted');
        }
        console.log('✓ Artifact updated!');
        console.log(`  ID:  ${artifact.id}`);
        console.log(`  URL: ${artifact.url}`);
        console.log(`  Status: Ready\n`);
      } catch (error) {
        console.error('\n✗ Failed to update artifact:');
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
