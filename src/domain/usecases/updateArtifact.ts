import { writeFileSync, readFileSync } from "fs";
import { join } from "path";
import type { Artifact } from "../entities/Artifact";
import type { ArtifactRepository } from "../repositories/ArtifactRepository";
import type { ComponentParser } from "../services/ComponentParser";
import type { ServerManager } from "../services/ServerManager";
import { findAvailablePort } from "../../infrastructure/services/BunServerManager";

export interface UpdateArtifactInput {
  artifactId: string;
  code?: string; // If provided, use this; else re-read from sourceFile/sourceCode
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
    const componentPath = join(artifact.tempDir, "component.tsx");

    // If new code is provided, write it to the component file
    if (input.code) {
      writeFileSync(componentPath, input.code);
      artifact.sourceCode = input.code;
      artifact.sourceFile = null; // Clear sourceFile since we're using inline code
    } else if (artifact.sourceFile) {
      // File-based artifact - re-read from original file and update component.tsx
      const updatedCode = readFileSync(artifact.sourceFile, "utf-8");
      writeFileSync(componentPath, updatedCode);
      artifact.sourceCode = updatedCode;
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
      artifact.status = "running";
      serverRestarted = true;
    }

    // Validate the component by parsing it
    // The server will generate HTML on-the-fly, so we just need to validate here
    await this.parser.analyze(componentPath);

    // Note: We no longer generate index.html here!
    // The server generates Sandpack HTML on-the-fly at request time.

    // Trigger reload (only if server was already running)
    if (!serverRestarted) {
      await this.serverManager.reload(artifact);
    }

    // Update artifact metadata
    artifact.updatedAt = new Date();
    await this.repository.save(artifact);

    const statusMessage = serverRestarted ? "Server restarted" : "Hot reloaded";
    return {
      artifact,
      serverRestarted,
      message: `Artifact updated!\n\nID: ${artifact.id}\nURL: ${artifact.url}\nStatus: ${statusMessage}`,
    };
  }
}
