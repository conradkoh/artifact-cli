import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import type { Artifact } from '../../domain/entities/Artifact';
import type { ServerManager } from '../../domain/services/ServerManager';
import { getArtifactDir } from '../repositories/FileArtifactRepository';

export class BunServerManager implements ServerManager {
  async start(artifact: Artifact): Promise<{ pid: number; port: number }> {
    const artifactDir = getArtifactDir(artifact.id);
    const serverScript = join(artifactDir, 'server.ts');
    const pidFile = join(artifactDir, 'server.pid');
    const logFile = join(artifactDir, 'server.log');

    // Generate server script with PID file writing
    const serverCode = this.generateServerScript(artifact.port, artifactDir, pidFile);
    writeFileSync(serverScript, serverCode);

    // Start the server using nohup for proper detachment
    Bun.spawn(['sh', '-c', `nohup bun run "${serverScript}" > "${logFile}" 2>&1 &`], {
      cwd: artifactDir,
      stdio: ['ignore', 'ignore', 'ignore'],
    });

    // Wait for PID file to be written
    let pid = 0;
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (existsSync(pidFile)) {
        pid = parseInt(readFileSync(pidFile, 'utf-8').trim(), 10);
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
    const artifactDir = getArtifactDir(artifact.id);
    const reloadFile = join(artifactDir, '.reload');
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

  private generateServerScript(port: number, artifactDir: string, pidFile: string): string {
    return `
import { watch, writeFileSync } from 'fs';
import { join } from 'path';

// Write PID file for process management
writeFileSync('${pidFile.replace(/\\/g, '\\\\')}', process.pid.toString());

const clients: Set<ReadableStreamDefaultController> = new Set();
const artifactDir = '${artifactDir.replace(/\\/g, '\\\\')}';

// Watch for reload signal
watch(artifactDir, (event, filename) => {
  if (filename === '.reload' || filename === 'index.html') {
    for (const client of clients) {
      try {
        client.enqueue('data: reload\\n\\n');
      } catch {}
    }
  }
});

const server = Bun.serve({
  port: ${port},
  async fetch(req) {
    const url = new URL(req.url);
    
    // SSE endpoint for hot reload
    if (url.pathname === '/__reload') {
      const stream = new ReadableStream({
        start(controller) {
          clients.add(controller);
          controller.enqueue('data: connected\\n\\n');
        },
        cancel(controller) {
          clients.delete(controller);
        },
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    // Serve index.html
    const indexPath = join(artifactDir, 'index.html');
    const html = await Bun.file(indexPath).text();
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  },
});

console.log(\`Server running at http://localhost:\${server.port}\`);
`;
  }
}

export async function findAvailablePort(startPort = 3001): Promise<number> {
  for (let port = startPort; port < startPort + 100; port++) {
    try {
      const server = Bun.serve({
        port,
        fetch() {
          return new Response('test');
        },
      });
      server.stop();
      return port;
    } catch {
      // Port in use, try next
    }
  }
  throw new Error('No available ports found');
}
