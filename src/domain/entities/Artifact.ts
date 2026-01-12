export type ArtifactStatus = 'starting' | 'running' | 'stopped' | 'error';

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
}

export function createArtifact(params: {
  id: string;
  sourceFile?: string | null;
  sourceCode?: string | null;
  componentName: string;
  tempDir: string;
  port: number;
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
  };
}
