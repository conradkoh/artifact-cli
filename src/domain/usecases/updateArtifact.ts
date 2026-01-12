import { writeFileSync } from 'fs';
import type { Artifact } from '../entities/Artifact';
import type { ArtifactRepository } from '../repositories/ArtifactRepository';
import type { ComponentParser } from '../services/ComponentParser';
import type { ServerManager } from '../services/ServerManager';
import { generateSandpackHtml } from '../../infrastructure/templates/sandpackTemplate';
import { findAvailablePort } from '../../infrastructure/services/BunServerManager';

export interface UpdateArtifactInput {
  artifactId: string;
}

export interface UpdateArtifactOutput {
  artifact: Artifact;
  serverRestarted: boolean;
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

    let serverRestarted = false;

    // Check if server is running, restart if needed
    const isRunning = await this.serverManager.isRunning(artifact);
    if (!isRunning) {
      // Try to reuse the same port, find new one if not available
      const port = await findAvailablePort(artifact.port);
      
      // Update port and URL if changed
      if (port !== artifact.port) {
        artifact.port = port;
        artifact.url = `http://localhost:${port}/${artifact.id}`;
      }

      // Restart the server
      const { pid } = await this.serverManager.start(artifact);
      artifact.pid = pid;
      artifact.status = 'running';
      serverRestarted = true;
    }

    // Re-parse the component
    const analysis = await this.parser.analyze(artifact.sourceFile);

    // Regenerate Sandpack HTML
    const html = generateSandpackHtml(analysis);
    writeFileSync(`${artifact.tempDir}/index.html`, html);

    // Trigger reload (only if server was already running)
    if (!serverRestarted) {
      await this.serverManager.reload(artifact);
    }

    // Update artifact metadata
    artifact.updatedAt = new Date();
    await this.repository.save(artifact);

    return { artifact, serverRestarted };
  }
}
