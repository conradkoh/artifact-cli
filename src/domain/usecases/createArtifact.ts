import { resolve } from 'path';
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
  filePath: string;
}

export interface CreateArtifactOutput {
  artifact: Artifact;
}

export class CreateArtifactUseCase {
  constructor(
    private repository: ArtifactRepository,
    private parser: ComponentParser,
    private serverManager: ServerManager
  ) {}

  async execute(input: CreateArtifactInput): Promise<CreateArtifactOutput> {
    const absolutePath = resolve(input.filePath);

    // Check if artifact already exists for this file
    const existing = await this.repository.findBySourceFile(absolutePath);
    if (existing) {
      const isRunning = await this.serverManager.isRunning(existing);
      if (isRunning) {
        return { artifact: existing };
      }
      // Clean up stale artifact
      await this.repository.delete(existing.id);
    }

    // Parse the component
    const analysis = await this.parser.analyze(absolutePath);

    // Create artifact
    const id = nanoid(6);
    const port = await findAvailablePort();
    const artifactDir = getArtifactDir(id);

    mkdirSync(artifactDir, { recursive: true });

    const artifact = createArtifact({
      id,
      sourceFile: absolutePath,
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

    return { artifact };
  }
}
