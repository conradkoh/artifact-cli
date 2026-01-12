export type ArtifactStatus = 'starting' | 'running' | 'stopped' | 'error';
export type ArtifactLocation = 'temp' | 'saved';

export interface Artifact {
  id: string;
  sourceFile: string | null;      // null when created via inline code
  sourceCode: string | null;      // stored when created via inline code
  componentName: string;
  tempDir: string;
  port: number;
  url: string;
  pid: number | null;
  status: ArtifactStatus;
  createdAt: Date;
  updatedAt: Date;
  // Location fields
  location: ArtifactLocation;     // 'temp' or 'saved'
  savedPath: string | null;       // Absolute path to saved .artifact/saved/{id}/ directory
}

export function createArtifact(params: {
  id: string;
  sourceFile?: string | null;
  sourceCode?: string | null;
  componentName: string;
  tempDir: string;
  port: number;
  location?: ArtifactLocation;
  savedPath?: string | null;
}): Artifact {
  return {
    id: params.id,
    sourceFile: params.sourceFile ?? null,
    sourceCode: params.sourceCode ?? null,
    componentName: params.componentName,
    tempDir: params.tempDir,
    port: params.port,
    url: `http://localhost:${params.port}/${params.id}`,
    pid: null,
    status: 'starting',
    createdAt: new Date(),
    updatedAt: new Date(),
    location: params.location ?? 'temp',
    savedPath: params.savedPath ?? null,
  };
}
