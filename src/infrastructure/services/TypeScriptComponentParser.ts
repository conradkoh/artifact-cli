import { readFileSync, existsSync } from 'fs';
import { dirname, resolve, extname } from 'path';
import type { ComponentParser } from '../../domain/services/ComponentParser';
import type {
  ComponentAnalysis,
  LocalImport,
} from '../../domain/entities/ComponentAnalysis';

// Simple regex-based parser (avoids TS compiler API complexity for now)
// Can be upgraded to use ts.createSourceFile later if needed

export class TypeScriptComponentParser implements ComponentParser {
  async analyze(filePath: string): Promise<ComponentAnalysis> {
    const absolutePath = resolve(filePath);
    if (!existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    const code = readFileSync(absolutePath, 'utf-8');
    const dependencies = this.extractNpmDependencies(code);
    const localImports = await this.resolveLocalImports(code, absolutePath);
    const componentName = this.findComponentName(code, absolutePath);

    return {
      componentName,
      code,
      dependencies,
      localImports,
    };
  }

  private extractNpmDependencies(code: string): string[] {
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const deps = new Set<string>();

    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const importPath = match[1];
      // Skip relative imports
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        // Handle scoped packages like @org/package
        const parts = importPath.split('/');
        if (importPath.startsWith('@')) {
          deps.add(`${parts[0]}/${parts[1]}`);
        } else {
          deps.add(parts[0]);
        }
      }
    }

    // Always include react
    deps.add('react');
    deps.add('react-dom');

    return Array.from(deps);
  }

  private async resolveLocalImports(
    code: string,
    filePath: string,
    depth = 0
  ): Promise<LocalImport[]> {
    if (depth > 2) return []; // Limit recursion depth

    const dir = dirname(filePath);
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const localImports: LocalImport[] = [];

    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith('.')) {
        const resolved = this.resolveFilePath(dir, importPath);
        if (resolved && existsSync(resolved)) {
          const importCode = readFileSync(resolved, 'utf-8');
          localImports.push({
            importPath,
            resolvedPath: resolved,
            code: importCode,
          });

          // Recursively resolve imports from this file
          const nestedImports = await this.resolveLocalImports(
            importCode,
            resolved,
            depth + 1
          );
          localImports.push(...nestedImports);
        }
      }
    }

    return localImports;
  }

  private resolveFilePath(dir: string, importPath: string): string | null {
    const extensions = ['.tsx', '.ts', '.jsx', '.js'];
    const basePath = resolve(dir, importPath);

    // Check if it's already a full path with extension
    if (existsSync(basePath)) {
      return basePath;
    }

    // Try adding extensions
    for (const ext of extensions) {
      const withExt = basePath + ext;
      if (existsSync(withExt)) {
        return withExt;
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexPath = resolve(basePath, `index${ext}`);
      if (existsSync(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }

  private findComponentName(code: string, filePath: string): string {
    // Try to find default export function/const name
    const defaultFuncMatch = code.match(
      /export\s+default\s+function\s+(\w+)/
    );
    if (defaultFuncMatch) return defaultFuncMatch[1];

    // Try to find default export of a const
    const defaultConstMatch = code.match(
      /export\s+default\s+(\w+)/
    );
    if (defaultConstMatch) return defaultConstMatch[1];

    // Try to find named export that looks like a component (PascalCase)
    const namedExportMatch = code.match(
      /export\s+(?:const|function)\s+([A-Z]\w+)/
    );
    if (namedExportMatch) return namedExportMatch[1];

    // Fallback to filename
    const filename = filePath.split('/').pop() || 'Component';
    return filename.replace(/\.(tsx?|jsx?)$/, '');
  }
}
