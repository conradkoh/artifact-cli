import type { Artifact } from '../entities/Artifact';

export interface ServerManager {
  start(artifact: Artifact): Promise<{ pid: number; port: number }>;
  stop(artifact: Artifact): Promise<void>;
  reload(artifact: Artifact): Promise<void>;
  isRunning(artifact: Artifact): Promise<boolean>;
}
