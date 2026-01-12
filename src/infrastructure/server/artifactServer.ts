import { watch, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { generateSandpackHtml } from "../templates/sandpackTemplate";
import { TypeScriptComponentParser } from "../services/TypeScriptComponentParser";

export interface ArtifactServerConfig {
  artifactId: string;
  port: number;
  artifactDir: string;
}

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

  // SSE clients for hot reload
  const clients: Set<ReadableStreamDefaultController> = new Set();

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

  const server = Bun.serve({
    port,
    idleTimeout: 0, // Disable timeout for SSE connections
    async fetch(req) {
      const url = new URL(req.url);

      // SSE endpoint for hot reload
      if (url.pathname === "/__reload") {
        const stream = new ReadableStream({
          start(controller) {
            clients.add(controller);
            controller.enqueue("data: connected\n\n");
          },
          cancel(controller) {
            clients.delete(controller);
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
