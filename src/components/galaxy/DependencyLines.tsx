import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, Color } from 'three';
import { useExplorerStore } from '@/stores/explorer';

const NODE_COLORS: Record<string, string> = {
  component: '#00d4ff',
  util: '#7c3aed',
  store: '#ff6b35',
  style: '#ec4899',
  config: '#94a3b8',
  test: '#22c55e',
  entry: '#ffffff',
  unknown: '#64748b',
};

export function DependencyLines() {
  const graph = useExplorerStore((s) => s.graph);
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const highlightedEdges = useExplorerStore((s) => s.highlightedEdges);

  const { positions, colors } = useMemo(() => {
    if (!graph || graph.edges.length === 0) {
      return { positions: new Float32Array(0), colors: new Float32Array(0) };
    }

    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
    const posList: number[] = [];
    const colorList: number[] = [];

    const colorSource = new Color();
    const colorTarget = new Color();

    for (const edge of graph.edges) {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (!sourceNode || !targetNode) continue;

      const [sx, sy, sz] = sourceNode.position;
      const [tx, ty, tz] = targetNode.position;

      // Determine edge highlighting
      let opacityFactor = 0.2;
      const isConnectedToSelection = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
      const isAIHighlighted = highlightedEdges.has(`${edge.source}\0${edge.target}`) || highlightedEdges.has(`${edge.target}\0${edge.source}`);

      if (isConnectedToSelection || isAIHighlighted) {
        opacityFactor = 1.0;
      } else if (selectedNode) {
        // Dim other lines when a specific node is highlighted
        opacityFactor = 0.04;
      }

      posList.push(sx, sy, sz, tx, ty, tz);

      // Interpolate colors based on nodes
      const c1 = NODE_COLORS[sourceNode.type] || '#64748b';
      const c2 = NODE_COLORS[targetNode.type] || '#64748b';

      colorSource.set(c1).multiplyScalar(opacityFactor);
      colorTarget.set(c2).multiplyScalar(opacityFactor);

      colorList.push(colorSource.r, colorSource.g, colorSource.b);
      colorList.push(colorTarget.r, colorTarget.g, colorTarget.b);
    }

    return {
      positions: new Float32Array(posList),
      colors: new Float32Array(colorList),
    };
  }, [graph, selectedNode, highlightedEdges]);

  const geometry = useMemo(() => {
    const geom = new BufferGeometry();
    if (positions.length > 0) {
      geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
      geom.setAttribute('color', new Float32BufferAttribute(colors, 3));
    }
    return geom;
  }, [positions, colors]);

  if (positions.length === 0) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors transparent depthWrite={false} />
    </lineSegments>
  );
}
export default DependencyLines;
