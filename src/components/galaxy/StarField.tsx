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
  
  // Store state and actions
  const graph = useExplorerStore((s) => s.graph);
  const selectNode = useExplorerStore((s) => s.selectNode);
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const hoveredNode = useExplorerStore((s) => s.hoveredNode);
  const setHoveredNode = useExplorerStore((s) => s.setHoveredNode);
  const setFocusedNode = useExplorerStore((s) => s.setFocusedNode);
  const highlightedNodes = useExplorerStore((s) => s.highlightedNodes);
  const isolatedCluster = useExplorerStore((s) => s.isolatedCluster);

  const nodes = useMemo(() => {
    if (!graph) return [];
    if (isolatedCluster) {
      return graph.nodes.filter((n) => n.folder === isolatedCluster || n.id === isolatedCluster);
    }
    return graph.nodes;
  }, [graph, isolatedCluster]);

  const count = nodes.length;

  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);

  // Track double tap / double click
  const lastClickRef = useRef<{ nodeId: string; time: number } | null>(null);

  // Compute related nodes (immediate dependencies) when a node is selected
  const relatedNodes = useMemo(() => {
    if (!selectedNode || !graph) return new Set<string>();
    const set = new Set<string>();
    set.add(selectedNode.id);
    for (const edge of graph.edges) {
      if (edge.source === selectedNode.id) {
        set.add(edge.target);
      }
      if (edge.target === selectedNode.id) {
        set.add(edge.source);
      }
    }
    return set;
  }, [selectedNode, graph]);

  // Update instance matrices and colors
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;

    for (let i = 0; i < count; i++) {
      const node = nodes[i];
      if (!node) continue;

      const [x, y, z] = node.position;
      dummy.position.set(x, y, z);

      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isHighlighted = highlightedNodes.has(node.id);
      const isRelated = !selectedNode || relatedNodes.has(node.id);

      // Star size scale based on centrality, lines, hover, and selection
      let baseScale = 0.6 + node.centrality * 2.5 + Math.min(node.lineCount / 1000, 1.5);
      if (isHovered) {
        baseScale *= 1.25; // Scale up on hover
      } else if (isSelected) {
        baseScale *= 1.15; // Scale up on selection
      }
      
      dummy.scale.set(baseScale, baseScale, baseScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Color mapping
      let hexColor = node.hasIssue ? ISSUE_COLOR : (NODE_COLORS[node.type] || NODE_COLORS.unknown);
      if (isSelected) {
        hexColor = '#C56A3A'; // Highlight selected node with warm orange accent
      }
      color.set(hexColor);

      // Embellish colors based on interaction state
      if (isSelected) {
        color.multiplyScalar(2.0); // selected glows brighter
      } else if (isHovered) {
        color.multiplyScalar(1.5); // hovered glows slightly brighter
      } else if (isHighlighted) {
        color.multiplyScalar(2.0); // AI highlights glow
      } else if (!isRelated) {
        color.multiplyScalar(0.25); // Dim unrelated nodes slightly
      }

      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [nodes, count, selectedNode, hoveredNode, highlightedNodes, relatedNodes, dummy, color]);

  // Handle pointer interactions
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const node = nodes[e.instanceId];
    if (node) {
      document.body.style.cursor = 'pointer';
      setHoveredNode(node);
    }
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
    setHoveredNode(null);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;

    const node = nodes[e.instanceId];
    if (!node) return;

    const now = Date.now();
    const lastClick = lastClickRef.current;

    if (lastClick && lastClick.nodeId === node.id && now - lastClick.time < 350) {
      // Double tap / Double click -> fly camera
      selectNode(node);
      setFocusedNode(node);
      lastClickRef.current = null;
    } else {
      // Single tap / Single click -> select node
      selectNode(node);
      lastClickRef.current = { nodeId: node.id, time: now };
    }
  };

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[null as any, null as any, count]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial roughness={0.1} metalness={0.9} emissive="#000000" />
    </instancedMesh>
  );
}

export default StarField;
