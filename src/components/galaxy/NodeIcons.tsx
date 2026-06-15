import { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useExplorerStore } from '@/stores/explorer';
import type { GraphNode } from '@/types/graph';
import { calculateNodeScale } from './StarField';

// Canvas-based textures for upright camera-facing terminal glyphs ">_"
const createTerminalIconTexture = (colorStr: string): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);
    ctx.font = '600 52px monospace';
    ctx.fillStyle = colorStr;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('>_', 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

// Reusable singletons to save memory and processing overhead
const defaultIconTexture = createTerminalIconTexture('#ded8cc'); // Muted warm-white/gray
const activeIconTexture = createTerminalIconTexture('#C56A3A');  // Selected warm-orange

const defaultMaterial = new THREE.SpriteMaterial({
  map: defaultIconTexture,
  transparent: true,
  alphaTest: 0.05,
  depthWrite: false,
  toneMapped: false,
});

const activeMaterial = new THREE.SpriteMaterial({
  map: activeIconTexture,
  transparent: true,
  alphaTest: 0.05,
  depthWrite: false,
  toneMapped: false,
});

export function NodeIcons() {
  const { camera } = useThree();
  const graph = useExplorerStore((s) => s.graph);
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const hoveredNode = useExplorerStore((s) => s.hoveredNode);
  const activeConstellationPath = useExplorerStore((s) => s.activeConstellationPath);

  const [visibleNodes, setVisibleNodes] = useState<GraphNode[]>([]);
  const lastCheckTime = useRef(0);
  const tempV = useMemo(() => new THREE.Vector3(), []);

  // Filter nodes when a cluster is isolated
  const nodes = useMemo(() => {
    if (!graph) return [];
    if (activeConstellationPath) {
      const filtered = graph.nodes.filter((n) => (n.constellationPath || n.folder) === activeConstellationPath);
      if (selectedNode && !filtered.some((n) => n.id === selectedNode.id)) {
        const found = graph.nodes.find((n) => n.id === selectedNode.id);
        if (found) filtered.push(found);
      }
      return filtered;
    }
    return graph.nodes;
  }, [graph, activeConstellationPath, selectedNode]);

  useFrame((state) => {
    const now = state.clock.getElapsedTime();
    
    // Throttle checks to 200ms to preserve frame rates
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

        // Calculate distance to camera for scale attenuation
        const [x, y, z] = node.position;
        const dist = camera.position.distanceTo(tempV.set(x, y, z));

        // Distance-aware scaling to keep sprite visual size stable
        let iconScale = dist * 0.014;
        iconScale = Math.max(0.7, Math.min(2.8, iconScale));

        if (isHovered) {
          iconScale *= 1.1; // 1.1x size on hover
        } else if (isSelected) {
          iconScale *= 1.15; // 1.15x size on select
        }

        // Calculate node size based on the same logarithmic logic
        const baseNodeSize = calculateNodeScale(node.lineCount);

        // Offset icon very close to the star core to maintain visual connection
        const yOffset = baseNodeSize * 0.35 + 0.1;

        return (
          <sprite
            key={node.id}
            position={[x, y + yOffset, z]}
            scale={[iconScale, iconScale, 1]}
            renderOrder={isSelected ? 100 : 0}
            material={isActive ? activeMaterial : defaultMaterial}
          />
        );
      })}
    </group>
  );
}

export default NodeIcons;
