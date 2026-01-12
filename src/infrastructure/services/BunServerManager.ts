import { existsSync, writeFileSync, readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import type { Artifact } from "../../domain/entities/Artifact";
import type { ServerManager } from "../../domain/services/ServerManager";
import {
  getArtifactDir,
  getArtifactRuntimeDir,
} from "../repositories/FileArtifactRepository";

/**
 * Returns the path to the CLI's server entry point.
 * This allows us to spawn the server from the CLI's own code,
 * rather than copying server code to each artifact's temp folder.
 */
function getServerEntryPoint(): string {
  // __dirname gives us the directory of this file (services/)
  // We need to go up one level to infrastructure/, then into server/
  return join(dirname(__dirname), "server", "index.ts");
}

export class BunServerManager implements ServerManager {
  async start(artifact: Artifact): Promise<{ pid: number; port: number }> {
    // Use artifact.tempDir which points to the correct location
    // (saved path for saved artifacts, temp path for temp artifacts)
    const artifactDir = artifact.tempDir;
    
    // Runtime state always goes to temp directory
    const runtimeDir = getArtifactRuntimeDir(artifact.id);

    // Ensure both directories exist
    if (!existsSync(artifactDir)) {
      mkdirSync(artifactDir, { recursive: true });
    }
    if (!existsSync(runtimeDir)) {
      mkdirSync(runtimeDir, { recursive: true });
    }

    const pidFile = join(runtimeDir, "server.pid");
    const logFile = join(runtimeDir, "server.log");

    // Get path to CLI's server module
    const serverEntry = getServerEntryPoint();

    // Start the server using CLI's server module (not a copied script)
    // Arguments: artifactId, port, artifactDir, runtimeDir
    Bun.spawn(
      [
        "sh",
        "-c",
        `nohup bun run "${serverEntry}" "${artifact.id}" "${artifact.port}" "${artifactDir}" "${runtimeDir}" > "${logFile}" 2>&1 &`,
      ],
      {
        cwd: artifactDir,
        stdio: ["ignore", "ignore", "ignore"],
      }
    );

    // Wait for PID file to be written
    let pid = 0;
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (existsSync(pidFile)) {
        pid = parseInt(readFileSync(pidFile, "utf-8").trim(), 10);
        if (pid > 0) break;
      }
    }

    return { pid, port: artifact.port };
  }

  async stop(artifact: Artifact): Promise<void> {
    if (artifact.pid) {
      try {
        process.kill(artifact.pid);
      } catch {
        // Process may already be dead
      }
    }
  }

  async reload(artifact: Artifact): Promise<void> {
    // For SSE-based reload, we write a signal file that the server watches
    const runtimeDir = getArtifactRuntimeDir(artifact.id);

    // Ensure runtime directory exists
    if (!existsSync(runtimeDir)) {
      mkdirSync(runtimeDir, { recursive: true });
    }

    const reloadFile = join(runtimeDir, ".reload");
    writeFileSync(reloadFile, Date.now().toString());
  }

  async isRunning(artifact: Artifact): Promise<boolean> {
    if (!artifact.pid) return false;
    try {
      process.kill(artifact.pid, 0);
      return true;
    } catch {
      return false;
    }
  }
}

export async function findAvailablePort(
  preferredPort?: number
): Promise<number> {
  // If a preferred port is specified, try it first
  if (preferredPort) {
    try {
      const server = Bun.serve({
        port: preferredPort,
        fetch() {
          return new Response("test");
        },
      });
      server.stop();
      return preferredPort;
    } catch {
      // Preferred port not available, find a random one
    }
  }

  // Use port 0 to let the OS assign a random available port
  const server = Bun.serve({
    port: 0,
    fetch() {
      return new Response("test");
    },
  });
  const port = server.port;
  server.stop();
  return port;
}
