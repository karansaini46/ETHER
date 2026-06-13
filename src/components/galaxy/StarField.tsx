import { useRef, useMemo, useEffect } from 'react';
import { InstancedMesh, Object3D, Color } from 'three';
import { useExplorerStore } from '@/stores/explorer';
import type { NodeType } from '@/types/graph';

const NODE_COLORS: Record<NodeType, string> = {
  entry: '#ECE9E1',      // Warm off-white
  component: '#A8AF86',  // Muted sage/green
  util: '#ECE9E1',       // Off-white
  store: '#E3C78A',      // Muted amber
  style: '#97958E',      // Dusty gray
  config: '#6E6B64',     // Darker gray
  test: '#A8AF86',       // Muted sage
  unknown: '#6E6B64',    // Darker gray
};

const ISSUE_COLOR = '#C6504B'; // Deep red for risk/issues


export function StarField() {
  const meshRef = useRef<InstancedMesh>(null);
  const graph = useExplorerStore((s) => s.graph);
  const selectNode = useExplorerStore((s) => s.selectNode);
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const highlightedNodes = useExplorerStore((s) => s.highlightedNodes);
  const isolatedCluster = useExplorerStore((s) => s.isolatedCluster);

  const nodes = useMemo(() => {
    if (!graph) return [];
    // Filter if a cluster is isolated
    if (isolatedCluster) {
      return graph.nodes.filter((n) => n.folder === isolatedCluster || n.id === isolatedCluster);
    }
    return graph.nodes;
  }, [graph, isolatedCluster]);

  const count = nodes.length;

  // Temporary Object3D for matrix calculations
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);

  // Update instance matrices and colors once nodes list changes
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;

    for (let i = 0; i < count; i++) {
      const node = nodes[i];
      if (!node) continue;

      const [x, y, z] = node.position;
      dummy.position.set(x, y, z);

      // Star size scales with centrality & line count
      const baseScale = 0.6 + node.centrality * 2.5 + Math.min(node.lineCount / 1000, 1.5);
      dummy.scale.set(baseScale, baseScale, baseScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Color mapping
      const hexColor = node.hasIssue ? ISSUE_COLOR : (NODE_COLORS[node.type] || NODE_COLORS.unknown);
      color.set(hexColor);
      
      // Make highlighted or selected stars brighter
      const isSelected = selectedNode?.id === node.id;
      const isHighlighted = highlightedNodes.has(node.id);
      if (isSelected || isHighlighted) {
        color.multiplyScalar(2.0);
      }

      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [nodes, count, selectedNode, highlightedNodes, dummy, color]);

  // Handle clicks on instances
  const handleClick = (e: any) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;

    const node = nodes[e.instanceId];
    if (node) {
      selectNode(node);
    }
  };

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[null as any, null as any, count]}
      onClick={handleClick}
    >
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial roughness={0.1} metalness={0.9} emissive="#000000" />
    </instancedMesh>
  );
}
export default StarField;
