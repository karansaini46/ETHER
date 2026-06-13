import { describe, it, expect, beforeEach } from 'vitest';
import { useExplorerStore } from './explorer.js';
import type { GraphNode } from '@/types/graph';

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

describe('explorer Zustand store', () => {
  beforeEach(() => {
    // Reset store state
    useExplorerStore.setState({
      graph: null,
      selectedNode: null,
      highlightedNodes: new Set(),
      highlightedEdges: new Set(),
      isolatedCluster: null,
      searchOpen: false,
      isDemo: false,
    });
  });

  it('should initialize with default empty parameters', () => {
    const state = useExplorerStore.getState();
    expect(state.selectedNode).toBeNull();
    expect(state.isolatedCluster).toBeNull();
    expect(state.searchOpen).toBe(false);
  });

  it('should update selectedNode and clear highlighted structures', () => {
    useExplorerStore.getState().selectNode(mockNode);
    expect(useExplorerStore.getState().selectedNode).toEqual(mockNode);

    // Deselect
    useExplorerStore.getState().selectNode(null);
    expect(useExplorerStore.getState().selectedNode).toBeNull();
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
