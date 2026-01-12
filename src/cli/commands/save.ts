import { Command } from "commander";
import { existsSync, mkdirSync, copyFileSync, rmSync } from "fs";
import { join } from "path";
import {
  FileArtifactRepository,
  getArtifactDir,
} from "../../infrastructure/repositories/FileArtifactRepository";
import { BunServerManager } from "../../infrastructure/services/BunServerManager";

export function saveCommand(): Command {
  const cmd = new Command("save");

  cmd
    .description("Save artifact to project directory (.artifact/saved/)")
    .argument("<id>", "Artifact ID to save")
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

        // 2. Check if already saved
        if (artifact.location === "saved") {
          console.log(`\n✓ Artifact is already saved at ${artifact.savedPath}\n`);
          return;
        }

        // 3. Create .artifact/saved/{id}/ in CWD
        const saveDir = join(process.cwd(), ".artifact", "saved", id);
        mkdirSync(saveDir, { recursive: true });

        // 4. Copy component.tsx from temp to saved
        const tempDir = getArtifactDir(id);
        const tempComponent = join(tempDir, "component.tsx");
        const savedComponent = join(saveDir, "component.tsx");

        if (!existsSync(tempComponent)) {
          console.error(`\n✗ Component file not found: ${tempComponent}\n`);
          process.exit(1);
        }

        copyFileSync(tempComponent, savedComponent);

        // 5. Stop server if running (will restart with new path)
        const wasRunning = await serverManager.isRunning(artifact);
        if (wasRunning) {
          await serverManager.stop(artifact);
        }

        // 6. Update artifact metadata
        artifact.location = "saved";
        artifact.savedPath = saveDir;
        artifact.tempDir = saveDir; // Server now uses saved path
        artifact.updatedAt = new Date();
        await repository.save(artifact);

        // 7. Remove component.tsx from temp (keep runtime state)
        try {
          rmSync(tempComponent, { force: true });
        } catch {
          // Ignore if file doesn't exist
        }

        console.log(`\n✓ Artifact saved to .artifact/saved/${id}/`);
        if (wasRunning) {
          console.log("  Server was stopped. Use 'artifact open " + id + "' to restart.");
        }
        console.log("");
      } catch (error) {
        console.error("\n✗ Failed to save artifact:");
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
