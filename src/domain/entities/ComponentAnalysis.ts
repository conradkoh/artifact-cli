export interface LocalImport {
  importPath: string;
  resolvedPath: string;
  code: string;
}

export interface ComponentAnalysis {
  componentName: string;
  code: string;
  dependencies: string[];
  localImports: LocalImport[];
}
