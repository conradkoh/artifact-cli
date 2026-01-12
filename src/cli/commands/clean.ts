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
    .option("--include-saved", "Also clean saved artifacts (default: skip saved)")
    .argument("[id]", "Artifact ID to remove (omit if using --all)")
    .action(async (id: string | undefined, options: { all?: boolean; force?: boolean; includeSaved?: boolean }) => {
      try {
        const repository = new FileArtifactRepository();
        const serverManager = new BunServerManager();

        if (options.all) {
          // Clean all stopped artifacts
          const artifacts = await repository.findAll();
          let cleanedCount = 0;
          let skippedRunning = 0;
          let skippedSaved = 0;

          for (const artifact of artifacts) {
            // Skip saved artifacts unless --include-saved
            if (artifact.location === "saved" && !options.includeSaved) {
              skippedSaved++;
              continue;
            }

            const isRunning = await serverManager.isRunning(artifact);

            if (isRunning) {
              if (options.force) {
                // Stop the server first
                await serverManager.stop(artifact);
              } else {
                skippedRunning++;
                continue;
              }
            }

            // Remove artifact directory
            const artifactDir = artifact.location === "saved" && artifact.savedPath
              ? artifact.savedPath
              : getArtifactDir(artifact.id);
            try {
              rmSync(artifactDir, { recursive: true, force: true });
            } catch {
              // Directory might not exist
            }

            // Also remove temp runtime dir if it's a saved artifact
            if (artifact.location === "saved") {
              try {
                rmSync(getArtifactDir(artifact.id), { recursive: true, force: true });
              } catch {
                // Directory might not exist
              }
            }

            // Remove from repository
            await repository.delete(artifact.id);
            cleanedCount++;
          }

          if (cleanedCount === 0 && skippedRunning === 0 && skippedSaved === 0) {
            console.log("\nNo artifacts to clean.\n");
          } else {
            console.log(`\n✓ Removed ${cleanedCount} artifact${cleanedCount !== 1 ? "s" : ""}`);
            if (skippedRunning > 0) {
              console.log(`  Skipped ${skippedRunning} running artifact${skippedRunning !== 1 ? "s" : ""} (use --force to remove)`);
            }
            if (skippedSaved > 0) {
              console.log(`  Skipped ${skippedSaved} saved artifact${skippedSaved !== 1 ? "s" : ""} (use --include-saved to remove)`);
            }
            console.log("");
          }
          return;
        }

        if (!id) {
          console.error("\n✗ Please provide an artifact ID or use --all\n");
          console.log("  Usage: artifact clean <id>");
          console.log("         artifact clean --all");
          console.log("         artifact clean --all --force  (also stops running servers)");
          console.log("         artifact clean --all --include-saved  (also cleans saved artifacts)\n");
          process.exit(1);
        }

        // Clean single artifact
        const artifact = await repository.findById(id);

        if (!artifact) {
          console.error(`\n✗ Artifact not found: ${id}\n`);
          process.exit(1);
        }

        // Warn about saved artifacts
        if (artifact.location === "saved" && !options.includeSaved) {
          console.error(`\n✗ Artifact ${id} is saved at ${artifact.savedPath}`);
          console.log("  Use --include-saved to remove saved artifacts\n");
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
        const artifactDir = artifact.location === "saved" && artifact.savedPath
          ? artifact.savedPath
          : getArtifactDir(artifact.id);
        try {
          rmSync(artifactDir, { recursive: true, force: true });
        } catch {
          // Directory might not exist
        }

        // Also remove temp runtime dir if it's a saved artifact
        if (artifact.location === "saved") {
          try {
            rmSync(getArtifactDir(artifact.id), { recursive: true, force: true });
          } catch {
            // Directory might not exist
          }
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
