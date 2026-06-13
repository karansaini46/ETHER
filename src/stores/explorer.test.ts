import { describe, it, expect, beforeEach } from 'vitest';
import { useExplorerStore } from './explorer.js';
import type { GraphNode, GraphData } from '@/types/graph';

const mockNode: GraphNode = {
  id: 'src/main.tsx',
  label: 'main',
  type: 'entry',
  folder: 'src',
  language: 'TypeScript',
  size: 300,
  lineCount: 10,
  position: [0, 0, 0],
  centrality: 0.9,
  weight: 2,
  commits: 4,
  lastModified: null,
  isRecent: false,
  hasIssue: false,
  riskLevel: 'low',
  importCount: 1,
  importedByCount: 1,
};

const mockGraphData: GraphData = {
  nodes: [mockNode],
  edges: [],
  repoName: 'test-repo',
  repoOwner: 'test-owner',
  defaultBranch: 'main',
  totalFiles: 1,
  analyzedFiles: 1,
  languages: { 'TypeScript': 1 },
  fetchedAt: Date.now(),
};

describe('explorer Zustand store', () => {
  beforeEach(() => {
    // Reset store state
    useExplorerStore.setState({
      graph: null,
      selectedNode: null,
      selectedNodeId: null,
      highlightedNodes: new Set(),
      highlightedEdges: new Set(),
      isolatedCluster: null,
      searchOpen: false,
      isDemo: false,
      inspectorOpen: false,
      renderingOpen: false,
      clustersOpen: true,
      nodeMap: new Map(),
      nodeIdByPath: new Map(),
      clusterNodeIdsByPath: new Map(),
    });
  });

  it('should initialize with default empty parameters', () => {
    const state = useExplorerStore.getState();
    expect(state.selectedNode).toBeNull();
    expect(state.selectedNodeId).toBeNull();
    expect(state.isolatedCluster).toBeNull();
    expect(state.searchOpen).toBe(false);
  });

  it('should update selectedNode and clear highlighted structures', () => {
    useExplorerStore.getState().setGraph(mockGraphData);

    useExplorerStore.getState().selectNode(mockNode);
    expect(useExplorerStore.getState().selectedNode).toEqual(mockNode);
    expect(useExplorerStore.getState().selectedNodeId).toBe(mockNode.id);
    expect(useExplorerStore.getState().inspectorOpen).toBe(true);

    // Deselect
    useExplorerStore.getState().selectNode(null);
    expect(useExplorerStore.getState().selectedNode).toBeNull();
    expect(useExplorerStore.getState().selectedNodeId).toBeNull();
  });

  it('should resolve node by path with normalization', () => {
    const graphData: GraphData = {
      ...mockGraphData,
      nodes: [
        { ...mockNode, id: 'src/components/Button.tsx', label: 'Button' }
      ]
    };
    useExplorerStore.getState().setGraph(graphData);

    // Select using path with backslashes
    useExplorerStore.getState().selectNode('src\\components\\Button.tsx');
    expect(useExplorerStore.getState().selectedNodeId).toBe('src/components/Button.tsx');
  });

  it('should set searchOpen state toggle', () => {
    useExplorerStore.getState().setSearchOpen(true);
    expect(useExplorerStore.getState().searchOpen).toBe(true);
  });

  it('should isolate cluster by folder name', () => {
    useExplorerStore.getState().isolateCluster('src/features');
    expect(useExplorerStore.getState().isolatedCluster).toBe('src/features');
  });
});
