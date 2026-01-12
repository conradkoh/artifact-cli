import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { Artifact } from '../../domain/entities/Artifact';
import type { ArtifactRepository } from '../../domain/repositories/ArtifactRepository';

const ARTIFACT_CLI_DIR = join(tmpdir(), 'artifact-cli');
const ARTIFACTS_FILE = join(ARTIFACT_CLI_DIR, 'artifacts.json');

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readArtifacts(): Artifact[] {
  ensureDir(ARTIFACT_CLI_DIR);
  if (!existsSync(ARTIFACTS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(ARTIFACTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.map((a: any) => ({
      ...a,
      createdAt: new Date(a.createdAt),
      updatedAt: new Date(a.updatedAt),
      // Migration: default location to 'temp' for existing artifacts
      location: a.location ?? 'temp',
      savedPath: a.savedPath ?? null,
    }));
  } catch {
    return [];
  }
}

function writeArtifacts(artifacts: Artifact[]): void {
  ensureDir(ARTIFACT_CLI_DIR);
  writeFileSync(ARTIFACTS_FILE, JSON.stringify(artifacts, null, 2));
}

export class FileArtifactRepository implements ArtifactRepository {
  async save(artifact: Artifact): Promise<void> {
    const artifacts = readArtifacts();
    const index = artifacts.findIndex((a) => a.id === artifact.id);
    if (index >= 0) {
      artifacts[index] = artifact;
    } else {
      artifacts.push(artifact);
    }
    writeArtifacts(artifacts);
  }

  async findById(id: string): Promise<Artifact | null> {
    const artifacts = readArtifacts();
    return artifacts.find((a) => a.id === id) || null;
  }

  async findAll(): Promise<Artifact[]> {
    return readArtifacts();
  }

  async findBySourceFile(sourceFile: string): Promise<Artifact | null> {
    const artifacts = readArtifacts();
    return artifacts.find((a) => a.sourceFile === sourceFile) || null;
  }

  async delete(id: string): Promise<void> {
    const artifacts = readArtifacts();
    const filtered = artifacts.filter((a) => a.id !== id);
    writeArtifacts(filtered);
  }
}

/**
 * Returns the directory for an artifact's data (component.tsx).
 * This is the persistent user data directory.
 */
export function getArtifactDir(artifactId: string): string {
  return join(ARTIFACT_CLI_DIR, 'artifacts', artifactId);
}

/**
 * Returns the directory for an artifact's runtime state (pid, logs, reload signal).
 * This is ephemeral and can be deleted without losing user data.
 */
export function getArtifactRuntimeDir(artifactId: string): string {
  return join(getArtifactDir(artifactId), '.runtime');
}
