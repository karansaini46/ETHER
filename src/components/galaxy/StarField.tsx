import { useRef, useMemo } from 'react';
import { InstancedMesh, Object3D, Color } from 'three';
import { useFrame } from '@react-three/fiber';
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

// Normal node scale helper clamped strictly between 0.45 and 1.6
export function calculateNodeScale(metric: number): number {
  const safeMetric = Number.isFinite(metric) ? Math.max(0, metric) : 0;
  return Math.max(0.45, Math.min(1.6, 0.45 + Math.log1p(safeMetric) * 0.12));
}

export function StarField() {
  const meshRef = useRef<InstancedMesh>(null);
  
  // Store state and actions
  const graph = useExplorerStore((s) => s.graph);
  const selectFileByPath = useExplorerStore((s) => s.selectFileByPath);
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const hoveredNode = useExplorerStore((s) => s.hoveredNode);
  const setHoveredNode = useExplorerStore((s) => s.setHoveredNode);
  const highlightedNodes = useExplorerStore((s) => s.highlightedNodes);
  const activeConstellationPath = useExplorerStore((s) => s.activeConstellationPath);

  const nodes = useMemo(() => {
    if (!graph) return [];
    if (activeConstellationPath) {
      return graph.nodes.filter((n) => (n.constellationPath || n.folder) === activeConstellationPath);
    }
    return graph.nodes;
  }, [graph, activeConstellationPath]);

  const count = nodes.length;

  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);

  // Track double tap / double click
  const lastClickRef = useRef<{ nodeId: string; time: number } | null>(null);
  // Track pointer down coordinates to separate drag from click
  const pointerDownRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Track selection pulse animation time
  const lastSelectionTime = useRef(0);
  const prevSelectedId = useRef<string | null>(null);

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

  // Update instance matrices and colors every frame to animate selection pulse smoothly
  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;

    // Detect selection change to trigger one-shot pulse
    if (selectedNode?.id !== prevSelectedId.current) {
      prevSelectedId.current = selectedNode?.id || null;
      if (selectedNode) {
        lastSelectionTime.current = state.clock.getElapsedTime();
      }
    }

    const elapsed = state.clock.getElapsedTime() - lastSelectionTime.current;
    let pulseScale = 1.0;
    if (selectedNode && elapsed < 0.6) {
      // 600ms one-time pulse scaling up to 1.12x (pulseScale: 1.0 -> 1.12 -> 1.0)
      pulseScale = 1.0 + Math.sin((elapsed / 0.6) * Math.PI) * 0.12;
    }

    for (let i = 0; i < count; i++) {
      const node = nodes[i];
      if (!node) continue;

      const [x, y, z] = node.position;
      dummy.position.set(x, y, z);

      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isHighlighted = highlightedNodes.has(node.id);
      const isRelated = !selectedNode || relatedNodes.has(node.id);

      // Logarithmic node size calculation with bounds
      const baseScale = calculateNodeScale(node.lineCount);
      let visualScale = baseScale;

      if (isHovered) {
        visualScale = baseScale * 1.1;
      } else if (isSelected) {
        visualScale = baseScale * 1.15 * pulseScale;
      }
      
      // Enforce the hard upper bound of 1.9
      visualScale = Math.min(1.9, visualScale);

      dummy.scale.set(visualScale, visualScale, visualScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Color mapping
      let hexColor = node.hasIssue ? ISSUE_COLOR : (NODE_COLORS[node.type] || NODE_COLORS.unknown);
      if (isSelected) {
        hexColor = '#C56A3A'; // Selected Warm Orange
      }
      color.set(hexColor);

      // Embellish colors based on interaction state
      if (isSelected) {
        color.multiplyScalar(2.0); // Selected glows brighter
      } else if (isHovered) {
        color.multiplyScalar(1.5); // Hovered glows slightly brighter
      } else if (isHighlighted) {
        color.multiplyScalar(2.0); // AI highlights glow
      } else if (!isRelated) {
        color.multiplyScalar(0.25); // Dim unrelated nodes
      }

      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  // Handle pointer interactions
  const handlePointerDown = (e: any) => {
    pointerDownRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

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

    const down = pointerDownRef.current;
    if (down) {
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // If pointer moved more than 4 pixels, ignore selection as user was dragging camera
      if (dist > 4) return;
    }

    const node = nodes[e.instanceId];
    if (!node) return;

    const now = Date.now();
    const lastClick = lastClickRef.current;

    if (lastClick && lastClick.nodeId === node.id && now - lastClick.time < 350) {
      // Double click -> select and focus camera
      selectFileByPath(node.displayPath, { source: 'canvas', focusCamera: true });
      lastClickRef.current = null;
    } else {
      // Single click -> select node only
      selectFileByPath(node.displayPath, { source: 'canvas', focusCamera: false });
      lastClickRef.current = { nodeId: node.id, time: now };
    }
  };

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[null as any, null as any, count]}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial roughness={0.1} metalness={0.9} emissive="#000000" />
    </instancedMesh>
  );
}

export default StarField;
