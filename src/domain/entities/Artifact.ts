export type ArtifactStatus = 'starting' | 'running' | 'stopped' | 'error';

export interface Artifact {
  id: string;
  sourceFile: string;
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
  sourceFile: string;
  componentName: string;
  tempDir: string;
  port: number;
}): Artifact {
  return {
    id: params.id,
    sourceFile: params.sourceFile,
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
