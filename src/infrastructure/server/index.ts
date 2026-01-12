#!/usr/bin/env bun
/**
 * Entry point for artifact server process.
 * 
 * This script is spawned by BunServerManager to serve a single artifact.
 * It receives artifact configuration via CLI arguments.
 * 
 * Usage: bun run server/index.ts <artifactId> <port> <artifactDir> <runtimeDir>
 */

import { startArtifactServer } from "./artifactServer";

const artifactId = process.argv[2];
const port = parseInt(process.argv[3], 10);
const artifactDir = process.argv[4];
const runtimeDir = process.argv[5];

if (!artifactId || isNaN(port) || !artifactDir || !runtimeDir) {
  console.error("Usage: bun run server/index.ts <artifactId> <port> <artifactDir> <runtimeDir>");
  console.error("  artifactId: Unique artifact identifier");
  console.error("  port: Port number to listen on");
  console.error("  artifactDir: Path to artifact directory containing component.tsx");
  console.error("  runtimeDir: Path to runtime directory for PID/logs");
  process.exit(1);
}

// Start the server
startArtifactServer({ 
  artifactId, 
  port, 
  artifactDir,
  runtimeDir,
});
