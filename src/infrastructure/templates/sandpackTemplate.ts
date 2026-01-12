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
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1e1e1e;
    }
    #root { 
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: #2d2d2d;
      color: #fff;
      padding: 12px 16px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header .status {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4caf50;
    }
    .sandpack-container {
      flex: 1;
      overflow: hidden;
    }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #888;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="header">
      <span class="status"></span>
      <span>${analysis.componentName}</span>
    </div>
    <div class="sandpack-container" id="sandpack">
      <div class="loading">Loading Sandpack...</div>
    </div>
  </div>
  
  <script type="module">
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { Sandpack } from '@codesandbox/sandpack-react';
    
    const files = ${JSON.stringify(files, null, 2)};
    
    const customSetup = {
      dependencies: ${dependenciesJson}
    };
    
    function App() {
      return React.createElement(Sandpack, {
        files,
        customSetup,
        template: 'react-ts',
        theme: 'dark',
        options: {
          showNavigator: false,
          showTabs: true,
          showLineNumbers: true,
          editorHeight: '100%',
        },
      });
    }
    
    const container = document.getElementById('sandpack');
    const root = createRoot(container);
    root.render(React.createElement(App));
    
    // Hot reload listener
    const evtSource = new EventSource('/__reload');
    evtSource.onmessage = (event) => {
      if (event.data === 'reload') {
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
    <div style={{ padding: '20px' }}>
      <${analysis.componentName} />
    </div>
  );
}
`;
}
