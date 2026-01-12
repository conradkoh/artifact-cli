import type { ComponentAnalysis } from '../../domain/entities/ComponentAnalysis';

export function generateSandpackHtml(analysis: ComponentAnalysis): string {
  // Build files object for Sandpack
  const files: Record<string, string> = {};

  // Main component file
  files['/App.tsx'] = generateAppWrapper(analysis);

  // Original component
  files['/Component.tsx'] = analysis.code;

  // Local imports
  for (const localImport of analysis.localImports) {
    const sandpackPath = localImport.importPath.replace(/^\./, '');
    const ext = sandpackPath.includes('.') ? '' : '.tsx';
    files[sandpackPath + ext] = localImport.code;
  }

  // Filter out react/react-dom from dependencies (Sandpack provides them)
  const customDeps = analysis.dependencies.filter(
    (d) => d !== 'react' && d !== 'react-dom'
  );

  const dependenciesJson = JSON.stringify(
    customDeps.reduce(
      (acc, dep) => {
        acc[dep] = 'latest';
        return acc;
      },
      {} as Record<string, string>
    )
  );

  const reactVersion = '18.3.1';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artifact Preview - ${analysis.componentName}</title>
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
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { 
      height: 100%; 
      overflow: hidden;
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1e1e1e;
    }
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: #2d2d2d;
      color: #fff;
      padding: 0 16px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #3d3d3d;
      flex-shrink: 0;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4caf50;
    }
    .component-name {
      font-size: 14px;
      font-weight: 500;
    }
    .tabs {
      display: flex;
      gap: 4px;
    }
    .tab {
      padding: 8px 20px;
      background: transparent;
      border: none;
      color: #888;
      font-size: 14px;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.15s ease;
    }
    .tab:hover {
      background: #3d3d3d;
      color: #fff;
    }
    .tab.active {
      background: #0066ff;
      color: #fff;
    }
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
      background: #1e1e1e;
    }
    .preview-panel {
      background: #ffffff;
    }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #888;
      font-size: 14px;
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
    <div class="loading">Loading Sandpack...</div>
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
          // Header with tabs
          h('div', { className: 'header' },
            h('div', { className: 'header-left' },
              h('span', { className: 'status' }),
              h('span', { className: 'component-name' }, '${analysis.componentName}')
            ),
            h('div', { className: 'tabs' },
              h('button', {
                className: 'tab' + (activeTab === 'code' ? ' active' : ''),
                onClick: () => setActiveTab('code')
              }, 'Code'),
              h('button', {
                className: 'tab' + (activeTab === 'preview' ? ' active' : ''),
                onClick: () => setActiveTab('preview')
              }, 'Preview')
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
    evtSource.onmessage = (event) => {
      if (event.data === 'reload') {
        window.location.reload();
      }
    };
    
    // Heartbeat to keep server alive (every 30 seconds)
    setInterval(() => {
      fetch('/__heartbeat').catch(() => {
        // Server may have timed out, show a message
        console.log('Server connection lost. Run "artifact update" to restart.');
      });
    }, 30_000);
    
    // Send initial heartbeat
    fetch('/__heartbeat').catch(() => {});
  </script>
</body>
</html>`;
}

function generateAppWrapper(analysis: ComponentAnalysis): string {
  return `import React from 'react';
import ${analysis.componentName} from './Component';

export default function App() {
  return (
    <div style={{ padding: '20px' }}>
      <${analysis.componentName} />
    </div>
  );
}
`;
}
