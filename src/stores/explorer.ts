import { create } from 'zustand';
import type { GraphData, GraphNode } from '@/types/graph';
import type { AnalysisStage } from '@/types/api';

export interface SelectNodeOptions {
  source?: 'canvas' | 'sidebar' | 'search' | 'navigator' | 'dependency-list';
  focusCamera?: boolean;
  openInspector?: boolean;
  highlightDependencies?: boolean;
}

export const normalizePath = (p: string): string => {
  return p
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+/g, '/')
    .trim();
};

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

  // Lookup Maps
  nodeMap: Map<string, GraphNode>;
  nodeIdByPath: Map<string, string>;
  clusterNodeIdsByPath: Map<string, string[]>;

  // Selection
  selectedNode: GraphNode | null;
  selectedNodeId: string | null;
  hoveredNode: GraphNode | null;
  focusedNode: GraphNode | null;
  dependencyMode: 'all' | 'incoming' | 'outgoing' | 'impact';
  previousCameraState: { position: [number, number, number]; target: [number, number, number] } | null;
  highlightedNodes: Set<string>;
  highlightedEdges: Set<string>;
  isolatedCluster: string | null;

  // Layout Panels
  inspectorOpen: boolean;
  renderingOpen: boolean;
  clustersOpen: boolean;

  // Search
  searchQuery: string;
  searchOpen: boolean;

  // Actions
  setRepoUrl: (url: string | null) => void;
  setRepoInfo: (owner: string, name: string) => void;
  setAnalysisId: (id: string | null) => void;
  setAnalysisStatus: (stage: AnalysisStage | 'idle', progress: number, message: string, error?: string) => void;
  setGraph: (graph: GraphData | null, isDemo?: boolean) => void;
  selectNode: (nodeIdOrNode: string | GraphNode | null, options?: SelectNodeOptions) => void;
  setHoveredNode: (node: GraphNode | null) => void;
  setFocusedNode: (node: GraphNode | null) => void;
  setDependencyMode: (mode: 'all' | 'incoming' | 'outgoing' | 'impact') => void;
  setPreviousCameraState: (state: { position: [number, number, number]; target: [number, number, number] } | null) => void;
  highlightNodes: (ids: string[]) => void;
  highlightEdges: (keys: string[]) => void;
  clearHighlights: () => void;
  isolateCluster: (folder: string | null) => void;
  setInspectorOpen: (open: boolean) => void;
  setRenderingOpen: (open: boolean) => void;
  setClustersOpen: (open: boolean) => void;
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
  nodeMap: new Map<string, GraphNode>(),
  nodeIdByPath: new Map<string, string>(),
  clusterNodeIdsByPath: new Map<string, string[]>(),
  selectedNode: null,
  selectedNodeId: null,
  hoveredNode: null,
  focusedNode: null,
  dependencyMode: 'all' as const,
  previousCameraState: null,
  highlightedNodes: new Set<string>(),
  highlightedEdges: new Set<string>(),
  isolatedCluster: null,
  inspectorOpen: false,
  renderingOpen: false,
  clustersOpen: true,
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
  
  setGraph: (graph, isDemo = false) => set(() => {
    if (!graph) {
      return { 
        graph, 
        isDemo, 
        nodeMap: new Map(), 
        nodeIdByPath: new Map(), 
        clusterNodeIdsByPath: new Map() 
      };
    }

    const nodeMap = new Map<string, GraphNode>();
    const nodeIdByPath = new Map<string, string>();
    const clusterNodeIdsByPath = new Map<string, string[]>();

    for (const node of graph.nodes) {
      const normPath = normalizePath(node.id);
      nodeMap.set(node.id, node);
      nodeIdByPath.set(normPath, node.id);

      const folder = node.folder || '/';
      const normFolder = normalizePath(folder);
      if (!clusterNodeIdsByPath.has(normFolder)) {
        clusterNodeIdsByPath.set(normFolder, []);
      }
      clusterNodeIdsByPath.get(normFolder)!.push(node.id);
    }

    return {
      graph,
      isDemo,
      nodeMap,
      nodeIdByPath,
      clusterNodeIdsByPath
    };
  }),

  selectNode: (nodeIdOrNode, options) => set((state) => {
    if (!nodeIdOrNode) {
      return {
        selectedNode: null,
        selectedNodeId: null,
        highlightedNodes: new Set(),
        highlightedEdges: new Set(),
      };
    }

    let resolvedNode: GraphNode | null = null;
    if (typeof nodeIdOrNode === 'string') {
      const norm = normalizePath(nodeIdOrNode);
      const exactId = state.nodeIdByPath.get(norm);
      if (exactId) {
        resolvedNode = state.nodeMap.get(exactId) || null;
      }
      // Fallback searches
      if (!resolvedNode) {
        resolvedNode = state.nodeMap.get(nodeIdOrNode) || null;
      }
      if (!resolvedNode && state.graph) {
        resolvedNode = state.graph.nodes.find(n => normalizePath(n.id) === norm || n.label === nodeIdOrNode) || null;
      }
    } else {
      resolvedNode = nodeIdOrNode;
    }

    if (!resolvedNode) {
      console.warn(`[ETHER] Unresolved node identifier: ${nodeIdOrNode}`);
      return {};
    }

    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const focusCamera = options?.focusCamera ?? false;
    const openInspector = options?.openInspector ?? true;
    const highlightDependencies = options?.highlightDependencies ?? true;

    const updates: Partial<ExplorerState> = {
      selectedNode: resolvedNode,
      selectedNodeId: resolvedNode.id,
    };

    if (openInspector) {
      updates.inspectorOpen = true;
      if (w < 1200) {
        updates.renderingOpen = false;
      }
      if (w < 768) {
        updates.clustersOpen = false;
        updates.renderingOpen = false;
      }
    }

    if (focusCamera) {
      updates.focusedNode = resolvedNode;
    }

    if (highlightDependencies && state.graph) {
      const highlightedNodes = new Set<string>([resolvedNode.id]);
      const highlightedEdges = new Set<string>();
      for (const edge of state.graph.edges) {
        if (edge.source === resolvedNode.id) {
          highlightedEdges.add(`${edge.source}\0${edge.target}`);
          highlightedNodes.add(edge.target);
        } else if (edge.target === resolvedNode.id) {
          highlightedEdges.add(`${edge.source}\0${edge.target}`);
          highlightedNodes.add(edge.source);
        }
      }
      updates.highlightedNodes = highlightedNodes;
      updates.highlightedEdges = highlightedEdges;
    }

    return updates;
  }),

  setHoveredNode: (node) => set({ hoveredNode: node }),
  setFocusedNode: (node) => set({ focusedNode: node }),
  setDependencyMode: (mode) => set({ dependencyMode: mode }),
  setPreviousCameraState: (state) => set({ previousCameraState: state }),
  highlightNodes: (ids) => set({ highlightedNodes: new Set(ids) }),
  highlightEdges: (keys) => set({ highlightedEdges: new Set(keys) }),
  clearHighlights: () => set({ highlightedNodes: new Set(), highlightedEdges: new Set() }),
  isolateCluster: (folder) => set({ isolatedCluster: folder }),

  setInspectorOpen: (open) => set(() => {
    const updates: Partial<ExplorerState> = { inspectorOpen: open };
    if (open) {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      if (w < 1200) {
        updates.renderingOpen = false;
      }
      if (w < 768) {
        updates.clustersOpen = false;
        updates.renderingOpen = false;
      }
    }
    return updates;
  }),

  setRenderingOpen: (open) => set(() => {
    const updates: Partial<ExplorerState> = { renderingOpen: open };
    if (open) {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      if (w < 1200) {
        updates.inspectorOpen = false;
      }
      if (w < 768) {
        updates.clustersOpen = false;
        updates.inspectorOpen = false;
      }
    }
    return updates;
  }),

  setClustersOpen: (open) => set(() => {
    const updates: Partial<ExplorerState> = { clustersOpen: open };
    if (open) {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      if (w < 768) {
        updates.inspectorOpen = false;
        updates.renderingOpen = false;
      }
    }
    return updates;
  }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  
  reset: () => set(initialState),
}));
