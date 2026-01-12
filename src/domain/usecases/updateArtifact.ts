import { writeFileSync } from 'fs';
import { join } from 'path';
import type { Artifact } from '../entities/Artifact';
import type { ArtifactRepository } from '../repositories/ArtifactRepository';
import type { ComponentParser } from '../services/ComponentParser';
import type { ServerManager } from '../services/ServerManager';
import { generateSandpackHtml } from '../../infrastructure/templates/sandpackTemplate';
import { findAvailablePort } from '../../infrastructure/services/BunServerManager';

export interface UpdateArtifactInput {
  artifactId: string;
  code?: string;  // If provided, use this; else re-read from sourceFile/sourceCode
}

export interface UpdateArtifactOutput {
  artifact: Artifact;
  serverRestarted: boolean;
  message: string;
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

    // If new code is provided, write it to the component file
    if (input.code) {
      const componentPath = join(artifact.tempDir, 'component.tsx');
      writeFileSync(componentPath, input.code);
      artifact.sourceCode = input.code;
      artifact.sourceFile = null; // Clear sourceFile since we're using inline code
    }

    // Determine which file to parse
    let fileToAnalyze: string;
    if (artifact.sourceFile) {
      // File-based artifact - re-read from original file
      fileToAnalyze = artifact.sourceFile;
    } else {
      // Inline code artifact - read from temp component file
      fileToAnalyze = join(artifact.tempDir, 'component.tsx');
    }

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
    const analysis = await this.parser.analyze(fileToAnalyze);

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

    const statusMessage = serverRestarted ? 'Server restarted' : 'Hot reloaded';
    return {
      artifact,
      serverRestarted,
      message: `Artifact updated!\n\nID: ${artifact.id}\nURL: ${artifact.url}\nStatus: ${statusMessage}`,
    };
  }
}
