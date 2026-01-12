#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Find the Bun binary path
 * Priority:
 * 1. Bundled bun from node_modules/bun
 * 2. Global bun installation
 */
function findBunBinary() {
  // Try to find bun from the npm package
  const platform = os.platform();
  const arch = os.arch();
  
  // Map platform/arch to bun package naming
  let bunPlatform;
  if (platform === 'darwin') {
    bunPlatform = arch === 'arm64' ? 'darwin-aarch64' : 'darwin-x64';
  } else if (platform === 'linux') {
    bunPlatform = arch === 'arm64' ? 'linux-aarch64' : 'linux-x64';
  } else if (platform === 'win32') {
    bunPlatform = 'windows-x64';
  }

  // Check for bun in node_modules (installed as dependency)
  const possiblePaths = [
    // When installed as a dependency of artifact-cli
    path.join(__dirname, '..', 'node_modules', '.bin', 'bun'),
    path.join(__dirname, '..', 'node_modules', 'bun', 'bin', 'bun'),
    // When running from the package itself
    path.join(__dirname, '..', 'node_modules', '@oven', `bun-${bunPlatform}`, 'bin', 'bun'),
    // Windows executable
    path.join(__dirname, '..', 'node_modules', '.bin', 'bun.exe'),
  ];

  for (const bunPath of possiblePaths) {
    if (fs.existsSync(bunPath)) {
      return bunPath;
    }
  }

  // Fall back to global bun (if user has it installed)
  return 'bun';
}

function main() {
  const bunPath = findBunBinary();
  const entryPoint = path.join(__dirname, '..', 'index.ts');
  const args = process.argv.slice(2);

  const child = spawn(bunPath, ['run', entryPoint, ...args], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  });

  child.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.error('Error: Could not find Bun runtime.');
      console.error('Please ensure the package is installed correctly or install Bun globally:');
      console.error('  curl -fsSL https://bun.sh/install | bash');
      process.exit(1);
    }
    throw err;
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
}

main();
