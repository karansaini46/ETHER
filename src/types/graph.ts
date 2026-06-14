export type NodeType =
  | 'component'
  | 'util'
  | 'store'
  | 'style'
  | 'config'
  | 'test'
  | 'entry'
  | 'unknown';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface GraphNode {
  id: string;
  displayPath: string;
  fileName: string;
  constellationPath: string;
  label: string;
  type: NodeType;
  folder: string;
  language: string;
  size: number;
  lineCount: number;
  position: [number, number, number];
  centrality: number;
  weight: number;
  commits: number;
  lastModified: string | null;
  isRecent: boolean;
  hasIssue: boolean;
  riskLevel: RiskLevel;
  importCount: number;
  importedByCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  repoName: string;
  repoOwner: string;
  defaultBranch: string;
  totalFiles: number;
  analyzedFiles: number;
  languages: Record<string, number>;
  fetchedAt: number;
}
