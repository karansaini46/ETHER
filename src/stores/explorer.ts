import { create } from 'zustand';
import type { GraphData, GraphNode } from '@/types/graph';
import type { AnalysisStage } from '@/types/api';

interface ExplorerState {
  // Repository
  repoUrl: string | null;
  repoOwner: string | null;
  repoName: string | null;

  // Analysis
  analysisId: string | null;
  analysisStage: AnalysisStage | 'idle';
  analysisProgress: number;
  analysisMessage: string;
  analysisError: string | null;

  // Graph
  graph: GraphData | null;
  isDemo: boolean;

  // Selection
  selectedNode: GraphNode | null;
  highlightedNodes: Set<string>;
  highlightedEdges: Set<string>;
  isolatedCluster: string | null;

  // Search
  searchQuery: string;
  searchOpen: boolean;

  // Actions
  setRepoUrl: (url: string | null) => void;
  setRepoInfo: (owner: string, name: string) => void;
  setAnalysisId: (id: string | null) => void;
  setAnalysisStatus: (stage: AnalysisStage | 'idle', progress: number, message: string, error?: string) => void;
  setGraph: (graph: GraphData | null, isDemo?: boolean) => void;
  selectNode: (node: GraphNode | null) => void;
  highlightNodes: (ids: string[]) => void;
  highlightEdges: (keys: string[]) => void;
  clearHighlights: () => void;
  isolateCluster: (folder: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;
  reset: () => void;
}

const initialState = {
  repoUrl: null,
  repoOwner: null,
  repoName: null,
  analysisId: null,
  analysisStage: 'idle' as const,
  analysisProgress: 0,
  analysisMessage: '',
  analysisError: null,
  graph: null,
  isDemo: false,
  selectedNode: null,
  highlightedNodes: new Set<string>(),
  highlightedEdges: new Set<string>(),
  isolatedCluster: null,
  searchQuery: '',
  searchOpen: false,
};

export const useExplorerStore = create<ExplorerState>()((set) => ({
  ...initialState,

  setRepoUrl: (url) => set({ repoUrl: url }),
  setRepoInfo: (owner, name) => set({ repoOwner: owner, repoName: name }),
  setAnalysisId: (id) => set({ analysisId: id }),
  setAnalysisStatus: (stage, progress, message, error) =>
    set({ analysisStage: stage, analysisProgress: progress, analysisMessage: message, analysisError: error ?? null }),
  setGraph: (graph, isDemo = false) => set({ graph, isDemo }),
  selectNode: (node) => set({ selectedNode: node }),
  highlightNodes: (ids) => set({ highlightedNodes: new Set(ids) }),
  highlightEdges: (keys) => set({ highlightedEdges: new Set(keys) }),
  clearHighlights: () => set({ highlightedNodes: new Set(), highlightedEdges: new Set() }),
  isolateCluster: (folder) => set({ isolatedCluster: folder }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  reset: () => set(initialState),
}));
