import type { Artifact } from '../entities/Artifact';

export interface ArtifactRepository {
  save(artifact: Artifact): Promise<void>;
  findById(id: string): Promise<Artifact | null>;
  findAll(): Promise<Artifact[]>;
  findBySourceFile(sourceFile: string): Promise<Artifact | null>;
  delete(id: string): Promise<void>;
}
