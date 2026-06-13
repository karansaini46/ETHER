import { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, Vector3 } from 'three';
import { useExplorerStore } from '@/stores/explorer';
import type { GraphNode } from '@/types/graph';

// Generate canvas-based textures dynamically to avoid rendering DOM elements for thousands of stars
const createTerminalIconTexture = (colorStr: string): CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 64, 64);
    // Draw monospace terminal glyph ">_"
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = colorStr;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('>_', 32, 32);
  }
  const texture = new CanvasTexture(canvas);
  return texture;
};

// Singleton textures to reuse across all node sprites
const defaultIconTexture = createTerminalIconTexture('#97958E'); // Neutral gray
const activeIconTexture = createTerminalIconTexture('#C56A3A');  // Warm orange accent

export function NodeIcons() {
  const { camera } = useThree();
  const graph = useExplorerStore((s) => s.graph);
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const hoveredNode = useExplorerStore((s) => s.hoveredNode);
  const isolatedCluster = useExplorerStore((s) => s.isolatedCluster);

  const [visibleNodes, setVisibleNodes] = useState<GraphNode[]>([]);
  const lastCheckTime = useRef(0);
  const tempV = useMemo(() => new Vector3(), []);

  // Filter nodes if a cluster is isolated
  const nodes = useMemo(() => {
    if (!graph) return [];
    if (isolatedCluster) {
      return graph.nodes.filter((n) => n.folder === isolatedCluster || n.id === isolatedCluster);
    }
    return graph.nodes;
  }, [graph, isolatedCluster]);

  useFrame((state) => {
    const now = state.clock.getElapsedTime();
    
    // Throttle computations to once every 200ms (10 frames) to preserve high FPS
    if (now - lastCheckTime.current < 0.2) return;
    lastCheckTime.current = now;

    if (nodes.length === 0) {
      if (visibleNodes.length > 0) setVisibleNodes([]);
      return;
    }

    const camPos = camera.position;
    const cameraDistToCenter = camPos.length();
    const isZoomedOut = cameraDistToCenter > 150;

    // 1. Distance & Level-of-Detail (LOD) check
    const candidates = nodes.filter((node) => {
      // Always show selected or hovered nodes
      if (selectedNode?.id === node.id || hoveredNode?.id === node.id) return true;

      const [nx, ny, nz] = node.position;
      const dx = nx - camPos.x;
      const dy = ny - camPos.y;
      const dz = nz - camPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Hide icons that are too far away
      if (dist > 120) return false;

      // LOD: Hide icons for smaller nodes when zoomed out
      if (isZoomedOut && node.centrality < 0.3) return false;

      return true;
    });

    // 2. Screen-Space Overlap Prevention
    // Sort candidates so selected/hovered nodes are evaluated first and claim space
    const sortedCandidates = [...candidates].sort((a, b) => {
      const prioA = (a.id === selectedNode?.id || a.id === hoveredNode?.id) ? 1 : 0;
      const prioB = (b.id === selectedNode?.id || b.id === hoveredNode?.id) ? 1 : 0;
      return prioB - prioA;
    });

    const acceptedNodes: GraphNode[] = [];
    const screenCoordinates: { x: number; y: number }[] = [];

    for (const node of sortedCandidates) {
      const [nx, ny, nz] = node.position;
      tempV.set(nx, ny, nz).project(camera);

      const isSpecial = node.id === selectedNode?.id || node.id === hoveredNode?.id;

      if (!isSpecial) {
        let isOverlapping = false;
        for (const coord of screenCoordinates) {
          const dx = tempV.x - coord.x;
          const dy = tempV.y - coord.y;
          // screen space boundaries range from -1 to 1; 0.08 represents around 8% of screen dimension
          if (Math.sqrt(dx * dx + dy * dy) < 0.08) {
            isOverlapping = true;
            break;
          }
        }
        if (isOverlapping) continue;
      }

      acceptedNodes.push(node);
      screenCoordinates.push({ x: tempV.x, y: tempV.y });
    }

    setVisibleNodes(acceptedNodes);
  });

  return (
    <group>
      {visibleNodes.map((node) => {
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const isActive = isSelected || isHovered;

        // Size rules based on hover and selection
        let iconScale = 1.6;
        if (isHovered) iconScale = 2.4;
        else if (isSelected) iconScale = 2.1;

        const baseNodeSize = 0.6 + node.centrality * 2.5 + Math.min(node.lineCount / 1000, 1.5);
        // Position icon slightly above the star node depending on its size scale
        const yOffset = baseNodeSize * 0.8 + 0.5;
        const [x, y, z] = node.position;

        return (
          <sprite
            key={node.id}
            position={[x, y + yOffset, z]}
            scale={[iconScale, iconScale, 1]}
          >
            <spriteMaterial
              map={isActive ? activeIconTexture : defaultIconTexture}
              transparent
              depthWrite={false}
              depthTest={true}
            />
          </sprite>
        );
      })}
    </group>
  );
}

export default NodeIcons;
