import { watch, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { generateSandpackHtml } from "../templates/sandpackTemplate";
import { TypeScriptComponentParser } from "../services/TypeScriptComponentParser";

export interface ArtifactServerConfig {
  artifactId: string;
  port: number;
  artifactDir: string;
}

// Idle timeout before auto-shutdown (30 seconds)
const IDLE_TIMEOUT_MS = 30_000;

export async function startArtifactServer(config: ArtifactServerConfig) {
  const { artifactId, port, artifactDir } = config;
  const componentPath = join(artifactDir, "component.tsx");
  const runtimeDir = join(artifactDir, ".runtime");

  // Ensure runtime directory exists
  if (!existsSync(runtimeDir)) {
    mkdirSync(runtimeDir, { recursive: true });
  }

  const pidFile = join(runtimeDir, "server.pid");

  // Write PID file
  writeFileSync(pidFile, process.pid.toString());

  // SSE clients for hot reload (also used for watcher tracking)
  const clients: Set<ReadableStreamDefaultController> = new Set();

  // Idle timer for auto-shutdown
  let idleTimer: Timer | null = null;

  // Reference to server (set after Bun.serve)
  let server: ReturnType<typeof Bun.serve>;

  // Called when a client connects
  const onClientConnect = (controller: ReadableStreamDefaultController) => {
    clients.add(controller);

    // Cancel any pending shutdown
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
      console.log(`[${artifactId}] Client connected, cancelled idle shutdown`);
    }

    console.log(`[${artifactId}] Client connected, ${clients.size} watcher(s)`);
  };

  // Called when a client disconnects
  const onClientDisconnect = (controller: ReadableStreamDefaultController) => {
    clients.delete(controller);

    console.log(
      `[${artifactId}] Client disconnected, ${clients.size} watcher(s) remaining`
    );

    // Start idle timer if no clients left
    if (clients.size === 0) {
      console.log(
        `[${artifactId}] No watchers, will shutdown in ${IDLE_TIMEOUT_MS / 1000}s...`
      );

      idleTimer = setTimeout(() => {
        console.log(`[${artifactId}] Idle timeout reached, shutting down...`);
        server.stop();
        process.exit(0);
      }, IDLE_TIMEOUT_MS);
    }
  };

  // Notify all clients to reload
  const notifyReload = () => {
    for (const client of clients) {
      try {
        client.enqueue("data: reload\n\n");
      } catch {
        // Client may have disconnected
      }
    }
  };

  // Watch for component changes
  watch(artifactDir, (event, filename) => {
    if (filename === "component.tsx") {
      notifyReload();
    }
  });

  // Watch .runtime for .reload signal file
  watch(runtimeDir, (event, filename) => {
    if (filename === ".reload") {
      notifyReload();
    }
  });

  server = Bun.serve({
    port,
    idleTimeout: 0, // Disable timeout for SSE connections
    async fetch(req) {
      const url = new URL(req.url);

      // SSE endpoint for hot reload
      if (url.pathname === "/__reload") {
        // Store controller reference for cleanup on cancel
        let streamController: ReadableStreamDefaultController;

        const stream = new ReadableStream({
          start(controller) {
            streamController = controller;
            onClientConnect(controller);
            controller.enqueue("data: connected\n\n");
          },
          cancel() {
            // Note: cancel() receives a reason, not the controller
            // We need to use the captured controller reference
            onClientDisconnect(streamController);
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      // Serve artifact HTML (generated on-the-fly)
      if (
        url.pathname === "/" + artifactId ||
        url.pathname === "/" + artifactId + "/"
      ) {
        try {
          // Parse component and generate HTML fresh each time
          const parser = new TypeScriptComponentParser();
          const analysis = await parser.analyze(componentPath);
          const html = generateSandpackHtml(analysis);

          return new Response(html, {
            headers: { "Content-Type": "text/html" },
          });
        } catch (error) {
          return new Response(
            `
            <!DOCTYPE html>
            <html>
            <head><title>Error</title></head>
            <body style="font-family: system-ui; padding: 40px; background: #1e1e1e; color: #fff;">
              <h1>Error Loading Artifact</h1>
              <pre style="background: #333; padding: 20px; overflow: auto;">${error}</pre>
            </body>
            </html>
          `,
            {
              status: 500,
              headers: { "Content-Type": "text/html" },
            }
          );
        }
      }

      // Redirect root to artifact path
      if (url.pathname === "/") {
        return Response.redirect("/" + artifactId, 302);
      }

      // 404 for other paths
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head><title>404 - Not Found</title></head>
        <body style="font-family: system-ui; padding: 40px; background: #1e1e1e; color: #fff;">
          <h1>404 - Artifact Not Found</h1>
          <p>The artifact ID in the URL does not match this server.</p>
          <p>Expected: <code>/${artifactId}</code></p>
          <p>Got: <code>${url.pathname}</code></p>
        </body>
        </html>
      `,
        {
          status: 404,
          headers: { "Content-Type": "text/html" },
        }
      );
    },
  });

  console.log(`Server running at http://localhost:${server.port}/${artifactId}`);
}
