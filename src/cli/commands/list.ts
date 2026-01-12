import { Command } from "commander";
import { FileArtifactRepository } from "../../infrastructure/repositories/FileArtifactRepository";
import { BunServerManager } from "../../infrastructure/services/BunServerManager";
import type { Artifact } from "../../domain/entities/Artifact";

interface ArtifactStatus {
  isRunning: boolean;
  watchers: number | null;
}

async function getArtifactStatus(
  artifact: Artifact,
  serverManager: BunServerManager
): Promise<ArtifactStatus> {
  const isRunning = await serverManager.isRunning(artifact);

  if (!isRunning) {
    return { isRunning: false, watchers: null };
  }

  // Fetch watcher count from running server
  try {
    const response = await fetch(
      `http://localhost:${artifact.port}/__status`
    );
    if (response.ok) {
      const status = (await response.json()) as { watchers: number };
      return { isRunning: true, watchers: status.watchers };
    }
  } catch {
    // Server might be starting up or unresponsive
  }

  return { isRunning: true, watchers: null };
}

export function listCommand(): Command {
  const cmd = new Command("list");

  cmd
    .description("List all artifacts and their status")
    .action(async () => {
      try {
        const repository = new FileArtifactRepository();
        const serverManager = new BunServerManager();

        const artifacts = await repository.findAll();

        if (artifacts.length === 0) {
          console.log("\nNo artifacts found.\n");
          console.log("  Create one with: artifact create <file>\n");
          return;
        }

        console.log("\nArtifacts:\n");
        console.log(
          "  " +
            "ID".padEnd(10) +
            "Component".padEnd(20) +
            "Status".padEnd(12) +
            "Watchers".padEnd(10) +
            "URL"
        );
        console.log("  " + "-".repeat(80));

        for (const artifact of artifacts) {
          const { isRunning, watchers } = await getArtifactStatus(
            artifact,
            serverManager
          );
          const status = isRunning ? "running" : "stopped";
          const statusColor = isRunning ? "\x1b[32m" : "\x1b[90m"; // green or gray
          const reset = "\x1b[0m";
          const watcherDisplay = watchers !== null ? String(watchers) : "-";

          console.log(
            "  " +
              artifact.id.padEnd(10) +
              artifact.componentName.padEnd(20) +
              statusColor +
              status.padEnd(12) +
              reset +
              watcherDisplay.padEnd(10) +
              artifact.url
          );
        }

        console.log("");
      } catch (error) {
        console.error("\n✗ Failed to list artifacts:");
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
