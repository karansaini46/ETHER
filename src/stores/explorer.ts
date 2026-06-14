import { create } from 'zustand';
import type { GraphData, GraphNode } from '@/types/graph';
import type { AnalysisStage } from '@/types/api';

export interface SelectNodeOptions {
  source?: 'canvas' | 'sidebar' | 'search' | 'navigator' | 'dependency-list';
  focusCamera?: boolean;
  openInspector?: boolean;
  revealNode?: boolean;
  highlightDependencies?: boolean;
}

export const normalizePath = (p: string): string => {
  let normalized = p
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+/g, '/');
  
  if (normalized.endsWith('/') && normalized.length > 1) {
    normalized = normalized.slice(0, -1);
  }
  
  try {
    normalized = decodeURIComponent(normalized);
  } catch (e) {
    // ignore decoding errors
  }
  
  return normalized.trim();
};

export function getDisplayPath(node: GraphNode): string {
  return node.displayPath;
}

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
  nodeById: Map<string, GraphNode>;
  nodeIdByFullPath: Map<string, string>;
  nodeIdsByConstellationPath: Map<string, string[]>;

  // Selection
  selectedNode: GraphNode | null;
  selectedNodeId: string | null;
  hoveredNode: GraphNode | null;
  focusedNode: GraphNode | null;
  dependencyMode: 'all' | 'incoming' | 'outgoing' | 'impact';
  previousCameraState: { position: [number, number, number]; target: [number, number, number] } | null;
  highlightedNodes: Set<string>;
  highlightedEdges: Set<string>;
  activeConstellationPath: string | null;

  // Layout Panels
  inspectorOpen: boolean;
  renderingOpen: boolean;
  clustersOpen: boolean;

  // Search
  searchQuery: string;
  searchOpen: boolean;

  // Non-blocking notification
  notification: string | null;

  // Actions
  setRepoUrl: (url: string | null) => void;
  setRepoInfo: (owner: string, name: string) => void;
  setAnalysisId: (id: string | null) => void;
  setAnalysisStatus: (stage: AnalysisStage | 'idle', progress: number, message: string, error?: string) => void;
  setGraph: (graph: GraphData | null, isDemo?: boolean) => void;
  selectNode: (nodeIdOrNode: string | GraphNode | null, options?: SelectNodeOptions) => void;
  selectFileByPath: (fullPath: string, options?: SelectNodeOptions) => void;
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
  setNotification: (msg: string | null) => void;
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
  nodeById: new Map<string, GraphNode>(),
  nodeIdByFullPath: new Map<string, string>(),
  nodeIdsByConstellationPath: new Map<string, string[]>(),
  selectedNode: null,
  selectedNodeId: null,
  hoveredNode: null,
  focusedNode: null,
  dependencyMode: 'all' as const,
  previousCameraState: null,
  highlightedNodes: new Set<string>(),
  highlightedEdges: new Set<string>(),
  activeConstellationPath: null,
  inspectorOpen: false,
  renderingOpen: false,
  clustersOpen: true,
  searchQuery: '',
  searchOpen: false,
  notification: null,
};

export const useExplorerStore = create<ExplorerState>()((set, get) => ({
  ...initialState,

  setRepoUrl: (url) => set({ repoUrl: url }),
  setRepoInfo: (owner, name) => set({ repoOwner: owner, repoName: name }),
  setAnalysisId: (id) => set({ analysisId: id }),
  setAnalysisStatus: (stage, progress, message, error) =>
    set({ analysisStage: stage, analysisProgress: progress, analysisMessage: message, analysisError: error ?? null }),
  
  setGraph: (graph, isDemo = false) => set((state) => {
    if (!graph) {
      return { 
        graph, 
        isDemo, 
        nodeById: new Map(), 
        nodeIdByFullPath: new Map(), 
        nodeIdsByConstellationPath: new Map() 
      };
    }

    const currentAnalysisId = state.analysisId || 'demo';

    // Map raw nodes to stable IDs and clean fields
    const mappedNodes = graph.nodes.map((node) => {
      const normPath = normalizePath(node.id);
      const stableId = normPath.startsWith(`${currentAnalysisId}:`)
        ? normPath
        : `${currentAnalysisId}:${normPath}`;
      
      const displayPath = stableId.substring(currentAnalysisId.length + 1);
      const normFolder = normalizePath(node.folder || '/');
      const fileName = displayPath.substring(displayPath.lastIndexOf('/') + 1) || displayPath;
      return {
        ...node,
        id: stableId,
        displayPath: displayPath,
        fileName: fileName,
        constellationPath: normFolder,
        folder: normFolder,
      };
    });

    // Map edges to match stable source and target IDs
    const mappedEdges = graph.edges.map((edge) => {
      const normSource = normalizePath(edge.source);
      const normTarget = normalizePath(edge.target);
      const stableSource = normSource.startsWith(`${currentAnalysisId}:`)
        ? normSource
        : `${currentAnalysisId}:${normSource}`;
      const stableTarget = normTarget.startsWith(`${currentAnalysisId}:`)
        ? normTarget
        : `${currentAnalysisId}:${normTarget}`;
      return {
        ...edge,
        source: stableSource,
        target: stableTarget,
      };
    });

    const mappedGraph = {
      ...graph,
      nodes: mappedNodes,
      edges: mappedEdges,
    };

    const nodeById = new Map<string, GraphNode>();
    const nodeIdByFullPath = new Map<string, string>();
    const nodeIdsByConstellationPath = new Map<string, string[]>();

    for (const node of mappedNodes) {
      nodeById.set(node.id, node);
      nodeIdByFullPath.set(node.displayPath, node.id);

      const normFolder = node.folder;
      if (!nodeIdsByConstellationPath.has(normFolder)) {
        nodeIdsByConstellationPath.set(normFolder, []);
      }
      nodeIdsByConstellationPath.get(normFolder)!.push(node.id);
    }

    return {
      graph: mappedGraph,
      isDemo,
      nodeById,
      nodeIdByFullPath,
      nodeIdsByConstellationPath
    };
  }),

  selectNode: (nodeIdOrNode, options) => set((state) => {
    if (!nodeIdOrNode) {
      return {
        selectedNode: null,
        selectedNodeId: null,
        focusedNode: null,
        highlightedNodes: new Set(),
        highlightedEdges: new Set(),
      };
    }

    let resolvedNode: GraphNode | null = null;
    if (typeof nodeIdOrNode === 'string') {
      const norm = normalizePath(nodeIdOrNode);
      const exactId = state.nodeIdByFullPath.get(norm);
      if (exactId) {
        resolvedNode = state.nodeById.get(exactId) || null;
      }
      if (!resolvedNode) {
        resolvedNode = state.nodeById.get(nodeIdOrNode) || null;
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
    const revealNode = options?.revealNode ?? false;
    const highlightDependencies = options?.highlightDependencies ?? true;

    const updates: Partial<ExplorerState> = {
      selectedNode: resolvedNode,
      selectedNodeId: resolvedNode.id,
    };

    if (revealNode && state.activeConstellationPath && state.activeConstellationPath !== resolvedNode.constellationPath) {
      updates.activeConstellationPath = null; // reset constellation filter
    }

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

  selectFileByPath: (fullPath, options) => {
    const norm = normalizePath(fullPath);
    const nodeId = get().nodeIdByFullPath.get(norm);
    if (nodeId) {
      const node = get().nodeById.get(nodeId);
      if (node) {
        if (get().activeConstellationPath && get().activeConstellationPath !== node.constellationPath) {
          set({ activeConstellationPath: null });
        }
        get().selectNode(nodeId, {
          revealNode: true,
          highlightDependencies: true,
          openInspector: options?.openInspector ?? true,
          focusCamera: options?.focusCamera ?? false,
          source: options?.source,
        });
      }
    } else {
      console.warn(`[DEV WARNING] File path not found in graph: ${norm}`);
      get().setNotification("This file is not available in the current graph.");
      setTimeout(() => {
        if (get().notification === "This file is not available in the current graph.") {
          get().setNotification(null);
        }
      }, 4000);
    }
  },

  setHoveredNode: (node) => set({ hoveredNode: node }),
  setFocusedNode: (node) => set({ focusedNode: node }),
  setDependencyMode: (mode) => set({ dependencyMode: mode }),
  setPreviousCameraState: (state) => set({ previousCameraState: state }),
  highlightNodes: (ids) => set({ highlightedNodes: new Set(ids) }),
  highlightEdges: (keys) => set({ highlightedEdges: new Set(keys) }),
  clearHighlights: () => set({ highlightedNodes: new Set(), highlightedEdges: new Set() }),
  isolateCluster: (folder) => set({ activeConstellationPath: folder }),

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
  setNotification: (msg) => set({ notification: msg }),
  
  reset: () => set(initialState),
}));

export default useExplorerStore;
