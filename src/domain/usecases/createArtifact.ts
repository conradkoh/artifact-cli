import { resolve, join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { nanoid } from 'nanoid';
import { createArtifact, type Artifact } from '../entities/Artifact';
import type { ArtifactRepository } from '../repositories/ArtifactRepository';
import type { ComponentParser } from '../services/ComponentParser';
import type { ServerManager } from '../services/ServerManager';
import { getArtifactDir } from '../../infrastructure/repositories/FileArtifactRepository';
import { findAvailablePort } from '../../infrastructure/services/BunServerManager';
import { generateSandpackHtml } from '../../infrastructure/templates/sandpackTemplate';

export interface CreateArtifactInput {
  // One of these must be provided
  filePath?: string;    // For CLI file-based creation
  code?: string;        // For agent inline code creation
  name?: string;        // Optional component name override
}

export interface CreateArtifactOutput {
  artifact: Artifact;
  message: string;
  stopInstructions: string;
}

export class CreateArtifactUseCase {
  constructor(
    private repository: ArtifactRepository,
    private parser: ComponentParser,
    private serverManager: ServerManager
  ) {}

  async execute(input: CreateArtifactInput): Promise<CreateArtifactOutput> {
    if (!input.filePath && !input.code) {
      throw new Error('Either filePath or code must be provided');
    }

    const id = nanoid(6);
    const artifactDir = getArtifactDir(id);
    mkdirSync(artifactDir, { recursive: true });

    let absolutePath: string;
    let sourceCode: string | null = null;

    if (input.code) {
      // Write inline code to temp file
      sourceCode = input.code;
      absolutePath = join(artifactDir, 'component.tsx');
      writeFileSync(absolutePath, sourceCode);
    } else {
      absolutePath = resolve(input.filePath!);
      
      // Check if artifact already exists for this file
      const existing = await this.repository.findBySourceFile(absolutePath);
      if (existing) {
        const isRunning = await this.serverManager.isRunning(existing);
        if (isRunning) {
          return {
            artifact: existing,
            message: `Artifact already exists!\n\nID: ${existing.id}\nURL: ${existing.url}`,
            stopInstructions: this.getStopInstructions(existing.id),
          };
        }
        // Clean up stale artifact
        await this.repository.delete(existing.id);
      }
    }

    // Parse the component
    const analysis = await this.parser.analyze(absolutePath);

    // Override component name if provided
    if (input.name) {
      analysis.componentName = input.name;
    }

    const port = await findAvailablePort();

    const artifact = createArtifact({
      id,
      sourceFile: input.code ? null : absolutePath,
      sourceCode,
      componentName: analysis.componentName,
      tempDir: artifactDir,
      port,
    });

    // Generate Sandpack HTML
    const html = generateSandpackHtml(analysis);
    writeFileSync(`${artifactDir}/index.html`, html);

    // Start server
    const { pid } = await this.serverManager.start(artifact);
    artifact.pid = pid;
    artifact.status = 'running';

    // Save artifact
    await this.repository.save(artifact);

    return {
      artifact,
      message: `Artifact created successfully!\n\nID: ${artifact.id}\nURL: ${artifact.url}`,
      stopInstructions: this.getStopInstructions(artifact.id),
    };
  }

  private getStopInstructions(artifactId: string): string {
    return `To stop this server later:\n  artifact stop ${artifactId}\n\nTo stop all servers:\n  artifact stop --all`;
  }
}
