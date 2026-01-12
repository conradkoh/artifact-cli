import { Command } from "commander";
import { rmSync } from "fs";
import { FileArtifactRepository, getArtifactDir } from "../../infrastructure/repositories/FileArtifactRepository";
import { BunServerManager } from "../../infrastructure/services/BunServerManager";

export function cleanCommand(): Command {
  const cmd = new Command("clean");

  cmd
    .description("Remove stopped artifacts and their data")
    .option("-a, --all", "Remove all stopped artifacts")
    .option("-f, --force", "Also stop running servers before removing")
    .argument("[id]", "Artifact ID to remove (omit if using --all)")
    .action(async (id: string | undefined, options: { all?: boolean; force?: boolean }) => {
      try {
        const repository = new FileArtifactRepository();
        const serverManager = new BunServerManager();

        if (options.all) {
          // Clean all stopped artifacts
          const artifacts = await repository.findAll();
          let cleanedCount = 0;
          let skippedCount = 0;

          for (const artifact of artifacts) {
            const isRunning = await serverManager.isRunning(artifact);

            if (isRunning) {
              if (options.force) {
                // Stop the server first
                await serverManager.stop(artifact);
              } else {
                skippedCount++;
                continue;
              }
            }

            // Remove artifact directory
            const artifactDir = getArtifactDir(artifact.id);
            try {
              rmSync(artifactDir, { recursive: true, force: true });
            } catch {
              // Directory might not exist
            }

            // Remove from repository
            await repository.delete(artifact.id);
            cleanedCount++;
          }

          if (cleanedCount === 0 && skippedCount === 0) {
            console.log("\nNo artifacts to clean.\n");
          } else {
            console.log(`\n✓ Removed ${cleanedCount} artifact${cleanedCount !== 1 ? "s" : ""}`);
            if (skippedCount > 0) {
              console.log(`  Skipped ${skippedCount} running artifact${skippedCount !== 1 ? "s" : ""} (use --force to remove)`);
            }
            console.log("");
          }
          return;
        }

        if (!id) {
          console.error("\n✗ Please provide an artifact ID or use --all\n");
          console.log("  Usage: artifact clean <id>");
          console.log("         artifact clean --all");
          console.log("         artifact clean --all --force  (also stops running servers)\n");
          process.exit(1);
        }

        // Clean single artifact
        const artifact = await repository.findById(id);

        if (!artifact) {
          console.error(`\n✗ Artifact not found: ${id}\n`);
          process.exit(1);
        }

        const isRunning = await serverManager.isRunning(artifact);

        if (isRunning && !options.force) {
          console.error(`\n✗ Artifact ${id} is still running.`);
          console.log("  Stop it first with: artifact stop " + id);
          console.log("  Or use --force to stop and remove: artifact clean " + id + " --force\n");
          process.exit(1);
        }

        if (isRunning) {
          await serverManager.stop(artifact);
        }

        // Remove artifact directory
        const artifactDir = getArtifactDir(artifact.id);
        try {
          rmSync(artifactDir, { recursive: true, force: true });
        } catch {
          // Directory might not exist
        }

        // Remove from repository
        await repository.delete(artifact.id);

        console.log(`\n✓ Removed artifact ${id}\n`);
      } catch (error) {
        console.error("\n✗ Failed to clean artifact:");
        console.error(`  ${(error as Error).message}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
