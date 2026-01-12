import { Command } from 'commander';
import { CreateArtifactUseCase } from '../../domain/usecases/createArtifact';
import { FileArtifactRepository } from '../../infrastructure/repositories/FileArtifactRepository';
import { TypeScriptComponentParser } from '../../infrastructure/services/TypeScriptComponentParser';
import { BunServerManager } from '../../infrastructure/services/BunServerManager';

export function createCommand(): Command {
  const cmd = new Command('create');

  cmd
    .description('Create a new artifact from a React component')
    .argument('[file]', 'Path to the React component file (optional if --code provided)')
    .option('--code <code>', 'Base64-encoded component code (for agent use)')
    .option('--name <name>', 'Component name (auto-detected if omitted)')
    .action(async (file: string | undefined, options: { code?: string; name?: string }) => {
      try {
        if (!file && !options.code) {
          console.error('\n✗ Error: Provide either a file path or --code\n');
          process.exit(1);
        }

        const repository = new FileArtifactRepository();
        const parser = new TypeScriptComponentParser();
        const serverManager = new BunServerManager();

        const useCase = new CreateArtifactUseCase(
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

        const { artifact, stopInstructions } = await useCase.execute({
          filePath: file,
          code,
          name: options.name,
        });

        console.log('\n✓ Artifact created successfully!');
        console.log(`  ID:  ${artifact.id}`);
        console.log(`  URL: ${artifact.url}`);
        console.log(`\n  To update: artifact update ${artifact.id}`);
        console.log(`  To open: artifact open ${artifact.id}`);
        console.log(`\n${stopInstructions}\n`);
      } catch (error) {
        console.error('\n✗ Failed to create artifact:');
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
