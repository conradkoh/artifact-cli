import type { ComponentAnalysis } from '../entities/ComponentAnalysis';

export interface ComponentParser {
  analyze(filePath: string): Promise<ComponentAnalysis>;
}
