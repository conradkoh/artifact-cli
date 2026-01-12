import type { Artifact } from '../entities/Artifact';
import type { ArtifactRepository } from '../repositories/ArtifactRepository';
import type { ServerManager } from '../services/ServerManager';
import { findAvailablePort } from '../../infrastructure/services/BunServerManager';

export interface OpenArtifactInput {
  artifactId: string;
}

export interface OpenArtifactOutput {
  found: boolean;
  artifact?: Artifact;
  url?: string;
  message: string;
  serverStarted?: boolean;
}

export class OpenArtifactUseCase {
  constructor(
    private repository: ArtifactRepository,
    private serverManager: ServerManager
  ) {}

  async execute(input: OpenArtifactInput): Promise<OpenArtifactOutput> {
    const artifact = await this.repository.findById(input.artifactId);
    
    if (!artifact) {
      return {
        found: false,
        message: `Artifact not found: ${input.artifactId}\nIt may have been deleted or cleaned up.`,
      };
    }

    let serverStarted = false;

    // Check if server is running, start if needed
    const isRunning = await this.serverManager.isRunning(artifact);
    if (!isRunning) {
      // Try to reuse the same port, find new one if not available
      const port = await findAvailablePort(artifact.port);
      
      // Update port and URL if changed
      if (port !== artifact.port) {
        artifact.port = port;
        artifact.url = `http://localhost:${port}/${artifact.id}`;
      }

      // Start the server
      const { pid } = await this.serverManager.start(artifact);
      artifact.pid = pid;
      artifact.status = 'running';
      artifact.updatedAt = new Date();
      await this.repository.save(artifact);
      serverStarted = true;
    }

    // Open in browser using system command
    await this.openInBrowser(artifact.url);

    return {
      found: true,
      artifact,
      url: artifact.url,
      message: `Opened artifact ${artifact.id} in browser\nURL: ${artifact.url}`,
      serverStarted,
    };
  }

  private async openInBrowser(url: string): Promise<void> {
    const platform = process.platform;
    let command: string;
    
    if (platform === 'darwin') {
      command = 'open';
    } else if (platform === 'win32') {
      command = 'start';
    } else {
      command = 'xdg-open';
    }

    const proc = Bun.spawn([command, url], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });

    await proc.exited;
  }
}
