import { Command } from "commander";
import { existsSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";
import {
  FileArtifactRepository,
  getArtifactDir,
} from "../../infrastructure/repositories/FileArtifactRepository";
import { BunServerManager } from "../../infrastructure/services/BunServerManager";

export function unsaveCommand(): Command {
  const cmd = new Command("unsave");

  cmd
    .description("Move saved artifact back to temp directory")
    .argument("<id>", "Artifact ID to unsave")
    .action(async (id: string) => {
      try {
        const repository = new FileArtifactRepository();
        const serverManager = new BunServerManager();

        // 1. Find artifact
        const artifact = await repository.findById(id);
        if (!artifact) {
          console.error(`\n✗ Artifact not found: ${id}\n`);
          process.exit(1);
        }

        // 2. Check if saved
        if (artifact.location !== "saved") {
          console.log(`\n✓ Artifact is already in temp (location: ${artifact.location})\n`);
          return;
        }

        // 3. Ensure temp directory exists
        const tempDir = getArtifactDir(id);
        mkdirSync(tempDir, { recursive: true });

        // 4. Copy component.tsx from saved to temp
        const savedComponent = join(artifact.savedPath!, "component.tsx");
        const tempComponent = join(tempDir, "component.tsx");

        if (!existsSync(savedComponent)) {
          console.error(`\n✗ Saved component not found: ${savedComponent}\n`);
          process.exit(1);
        }

        copyFileSync(savedComponent, tempComponent);

        // 5. Stop server if running (will restart with new path)
        const wasRunning = await serverManager.isRunning(artifact);
        if (wasRunning) {
          await serverManager.stop(artifact);
        }

        // 6. Update artifact metadata
        artifact.location = "temp";
        artifact.tempDir = tempDir;
        artifact.savedPath = null;
        artifact.updatedAt = new Date();
        await repository.save(artifact);

        // Note: We leave the saved directory in place
        // User can manually delete .artifact/saved/{id}/ or use git rm

        console.log(`\n✓ Artifact moved back to temp`);
        console.log(`  Note: .artifact/saved/${id}/ still exists - delete manually if not needed`);
        if (wasRunning) {
          console.log("  Server was stopped. Use 'artifact open " + id + "' to restart.");
        }
        console.log("");
      } catch (error) {
        console.error("\n✗ Failed to unsave artifact:");
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
