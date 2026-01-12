import type { ArtifactRepository } from '../repositories/ArtifactRepository';
import type { ServerManager } from '../services/ServerManager';

export interface PreviewArtifactInput {
  artifactId: string;
}

export interface PreviewArtifactOutput {
  success: boolean;
  url: string;
}

export class PreviewArtifactUseCase {
  constructor(
    private repository: ArtifactRepository,
    private serverManager: ServerManager
  ) {}

  async execute(input: PreviewArtifactInput): Promise<PreviewArtifactOutput> {
    const artifact = await this.repository.findById(input.artifactId);
    if (!artifact) {
      throw new Error(`Artifact not found: ${input.artifactId}`);
    }

    // Check if server is running
    const isRunning = await this.serverManager.isRunning(artifact);
    if (!isRunning) {
      throw new Error(`Artifact server is not running. Please create a new artifact.`);
    }

    // Open in browser using system command
    const platform = process.platform;
    let command: string;
    
    if (platform === 'darwin') {
      command = 'open';
    } else if (platform === 'win32') {
      command = 'start';
    } else {
      command = 'xdg-open';
    }

    const proc = Bun.spawn([command, artifact.url], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });

    await proc.exited;

    return { success: true, url: artifact.url };
  }
}
