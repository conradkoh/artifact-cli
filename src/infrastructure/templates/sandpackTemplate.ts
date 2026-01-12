import type { ComponentAnalysis } from "../../domain/entities/ComponentAnalysis";

export function generateSandpackHtml(analysis: ComponentAnalysis): string {
  // Build files object for Sandpack
  const files: Record<string, string> = {};

  // Main component file
  files["/App.tsx"] = generateAppWrapper(analysis);

  // Original component
  files["/Component.tsx"] = analysis.code;

  // Local imports
  for (const localImport of analysis.localImports) {
    const sandpackPath = localImport.importPath.replace(/^\./, "");
    const ext = sandpackPath.includes(".") ? "" : ".tsx";
    files[sandpackPath + ext] = localImport.code;
  }

  // Filter out react/react-dom from dependencies (Sandpack provides them)
  const customDeps = analysis.dependencies.filter(
    (d) => d !== "react" && d !== "react-dom"
  );

  const dependenciesJson = JSON.stringify(
    customDeps.reduce((acc, dep) => {
      acc[dep] = "latest";
      return acc;
    }, {} as Record<string, string>)
  );

  const reactVersion = "18.3.1";

  // Industrial Design System - Dark Steel Theme
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARTIFACT // ${analysis.componentName.toUpperCase()}</title>
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@${reactVersion}",
      "react/": "https://esm.sh/react@${reactVersion}/",
      "react-dom": "https://esm.sh/react-dom@${reactVersion}?external=react",
      "react-dom/": "https://esm.sh/react-dom@${reactVersion}&external=react/",
      "@codesandbox/sandpack-react": "https://esm.sh/@codesandbox/sandpack-react@2?external=react,react-dom",
      "@codesandbox/sandpack-client": "https://esm.sh/@codesandbox/sandpack-client@2"
    }
  }
  </script>
  <style>
    /* Industrial Design System - Dark Steel Theme */
    :root {
      --bg-primary: #09090b;
      --bg-surface: rgba(24, 24, 27, 0.5);
      --text-primary: #fafafa;
      --text-muted: #71717a;
      --accent: #fafafa;
      --accent-subtle: #27272a;
      --border-color: rgba(250, 250, 250, 0.1);
      --status-success: #34d399;
      --status-warning: #fbbf24;
      --status-error: #f87171;
      --status-info: #60a5fa;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    html, body, #root { 
      height: 100%; 
      overflow: hidden;
    }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
    }
    
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    /* Header - Industrial Style */
    .header {
      background: var(--bg-surface);
      backdrop-filter: blur(8px);
      padding: 0 1rem;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid var(--border-color);
      flex-shrink: 0;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    /* Square status indicator (not circle - per design system) */
    .status {
      width: 6px;
      height: 6px;
      background: var(--status-success);
    }
    
    .status.warning {
      background: var(--status-warning);
    }
    
    .status.error {
      background: var(--status-error);
    }
    
    /* Component name - uppercase, tracked */
    .component-name {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-primary);
    }
    
    /* Artifact ID badge */
    .artifact-id {
      font-size: 10px;
      font-weight: 700;
      font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    /* Tabs container */
    .tabs {
      display: flex;
      gap: 2px;
    }
    
    /* Tab buttons - Industrial style with no rounded corners */
    .tab {
      padding: 8px 16px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: all 0.1s ease;
      border-bottom: 2px solid transparent;
    }
    
    .tab:hover {
      color: var(--text-primary);
      background: var(--accent-subtle);
    }
    
    .tab.active {
      color: var(--text-primary);
      background: var(--accent-subtle);
      border-bottom: 2px solid var(--text-primary);
    }
    
    /* Content area */
    .content {
      flex: 1;
      overflow: hidden;
      position: relative;
    }
    
    .panel {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: none;
    }
    
    .panel.active {
      display: flex;
      flex-direction: column;
    }
    
    .code-panel {
      background: var(--bg-primary);
    }
    
    .preview-panel {
      background: #ffffff;
    }
    
    /* Loading state */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
    }
    
    .loading-text {
      color: var(--text-muted);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    .loading-bar {
      width: 120px;
      height: 2px;
      background: var(--accent-subtle);
      overflow: hidden;
    }
    
    .loading-bar::after {
      content: '';
      display: block;
      width: 40%;
      height: 100%;
      background: var(--text-primary);
      animation: loading 1s ease-in-out infinite;
    }
    
    @keyframes loading {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }
    
    /* Sandpack overrides for full height */
    .sp-wrapper, .sp-layout, .sp-stack {
      height: 100% !important;
    }
    .sp-code-editor {
      height: 100% !important;
    }
    .sp-preview-container {
      height: 100% !important;
    }
    .sp-preview-iframe {
      height: 100% !important;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <div class="loading-bar"></div>
      <div class="loading-text">Initializing Sandpack</div>
    </div>
  </div>
  
  <script type="module">
    import React, { useState } from 'react';
    import { createRoot } from 'react-dom/client';
    import { 
      SandpackProvider, 
      SandpackCodeEditor,
      SandpackPreview,
      SandpackFileExplorer,
      SandpackLayout
    } from '@codesandbox/sandpack-react';
    
    const files = ${JSON.stringify(files, null, 2)};
    
    const customSetup = {
      dependencies: ${dependenciesJson}
    };

    const h = React.createElement;
    
    function App() {
      const [activeTab, setActiveTab] = useState('preview');
      
      return h(SandpackProvider, {
        files,
        customSetup,
        template: 'react-ts',
        theme: 'dark',
      },
        h('div', { className: 'app-container' },
          // Header with tabs - Industrial Design
          h('div', { className: 'header' },
            h('div', { className: 'header-left' },
              h('span', { className: 'status' }),
              h('span', { className: 'component-name' }, '${analysis.componentName.toUpperCase()}')
            ),
            h('div', { className: 'tabs' },
              h('button', {
                className: 'tab' + (activeTab === 'code' ? ' active' : ''),
                onClick: () => setActiveTab('code')
              }, 'CODE'),
              h('button', {
                className: 'tab' + (activeTab === 'preview' ? ' active' : ''),
                onClick: () => setActiveTab('preview')
              }, 'PREVIEW')
            )
          ),
          // Content panels
          h('div', { className: 'content' },
            // Code panel
            h('div', { className: 'panel code-panel' + (activeTab === 'code' ? ' active' : '') },
              h(SandpackCodeEditor, {
                showTabs: true,
                showLineNumbers: true,
                style: { height: '100%' }
              })
            ),
            // Preview panel
            h('div', { className: 'panel preview-panel' + (activeTab === 'preview' ? ' active' : '') },
              h(SandpackPreview, {
                showOpenInCodeSandbox: false,
                showRefreshButton: true,
                style: { height: '100%' }
              })
            )
          )
        )
      );
    }
    
    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(h(App));
    
    // Hot reload listener
    const evtSource = new EventSource('/__reload');
    evtSource.onopen = () => {
      console.log('[artifact-cli] Hot reload connected');
    };
    evtSource.onerror = (e) => {
      console.error('[artifact-cli] Hot reload connection error', e);
    };
    evtSource.onmessage = (event) => {
      console.log('[artifact-cli] Received:', event.data);
      if (event.data === 'reload') {
        console.log('[artifact-cli] Reloading page...');
        window.location.reload();
      }
    };
  </script>
</body>
</html>`;
}

function generateAppWrapper(analysis: ComponentAnalysis): string {
  return `import React from 'react';
import ${analysis.componentName} from './Component';

export default function App() {
  return (
    <div>
      <${analysis.componentName} />
    </div>
  );
}
`;
}
