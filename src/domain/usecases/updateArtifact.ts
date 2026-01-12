import { writeFileSync } from 'fs';
import type { Artifact } from '../entities/Artifact';
import type { ArtifactRepository } from '../repositories/ArtifactRepository';
import type { ComponentParser } from '../services/ComponentParser';
import type { ServerManager } from '../services/ServerManager';
import { generateSandpackHtml } from '../../infrastructure/templates/sandpackTemplate';

export interface UpdateArtifactInput {
  artifactId: string;
}

export interface UpdateArtifactOutput {
  artifact: Artifact;
}

export class UpdateArtifactUseCase {
  constructor(
    private repository: ArtifactRepository,
    private parser: ComponentParser,
    private serverManager: ServerManager
  ) {}

  async execute(input: UpdateArtifactInput): Promise<UpdateArtifactOutput> {
    const artifact = await this.repository.findById(input.artifactId);
    if (!artifact) {
      throw new Error(`Artifact not found: ${input.artifactId}`);
    }

    // Check if server is running
    const isRunning = await this.serverManager.isRunning(artifact);
    if (!isRunning) {
      throw new Error(`Artifact server is not running. Please create a new artifact.`);
    }

    // Re-parse the component
    const analysis = await this.parser.analyze(artifact.sourceFile);

    // Regenerate Sandpack HTML
    const html = generateSandpackHtml(analysis);
    writeFileSync(`${artifact.tempDir}/index.html`, html);

    // Trigger reload
    await this.serverManager.reload(artifact);

    // Update artifact metadata
    artifact.updatedAt = new Date();
    await this.repository.save(artifact);

    return { artifact };
  }
}
