export interface AnalysisNode {
  id: string;
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

export interface AnalysisEdge {
  source: string;
  target: string;
  weight: number;
}

export interface AnalysisGraph {
  nodes: AnalysisNode[];
  edges: AnalysisEdge[];
  repoName: string;
  repoOwner: string;
  defaultBranch: string;
  totalFiles: number;
  analyzedFiles: number;
  languages: Record<string, number>;
  fetchedAt: number;
}

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

export type AnalysisStage =
  | 'validating'
  | 'reading-structure'
  | 'mapping-languages'
  | 'detecting-dependencies'
  | 'measuring-activity'
  | 'constructing-constellations'
  | 'calculating-layout'
  | 'ready'
  | 'error'
  | 'cancelled';

export interface AnalysisStatus {
  id: string;
  stage: AnalysisStage;
  progress: number;
  message: string;
  error?: string;
}

export interface AnalysisResult {
  id: string;
  status: AnalysisStatus;
  graph: AnalysisGraph | null;
  startedAt: number;
  completedAt: number | null;
}

export interface NavigatorAction {
  type: 'focusNodes' | 'highlightEdges' | 'openInspector' | 'isolateCluster' | 'showImpactPath' | 'showSearchResults';
  nodeIds?: string[];
  edgeKeys?: string[];
  message: string;
}

export interface NavigatorResponse {
  content: string;
  actions: NavigatorAction[];
  referencedFiles: string[];
}
