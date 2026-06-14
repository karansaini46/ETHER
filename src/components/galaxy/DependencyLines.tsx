import { useMemo, useRef } from 'react';
import { BufferGeometry, Float32BufferAttribute, Color } from 'three';
import { useFrame } from '@react-three/fiber';
import { useExplorerStore } from '@/stores/explorer';

const NODE_COLORS: Record<string, string> = {
  entry: '#ECE9E1',
  component: '#A8AF86',
  util: '#ECE9E1',
  store: '#E3C78A',
  style: '#97958E',
  config: '#6E6B64',
  test: '#A8AF86',
  unknown: '#6E6B64',
};

export function DependencyLines() {
  const graph = useExplorerStore((s) => s.graph);
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const dependencyMode = useExplorerStore((s) => s.dependencyMode);
  const highlightedEdges = useExplorerStore((s) => s.highlightedEdges);
  const nodeById = useExplorerStore((s) => s.nodeById);

  const pointsRef = useRef<any>(null);

  // Compute transitive dependencies for "impact path" mode
  const { outgoingTransitive, incomingTransitive } = useMemo(() => {
    if (!selectedNode || !graph || dependencyMode !== 'impact') {
      return { outgoingTransitive: new Set<string>(), incomingTransitive: new Set<string>() };
    }
    const outSet = new Set<string>();
    const inSet = new Set<string>();

    // Transitive Outgoing dependencies BFS
    let queue = [selectedNode.id];
    outSet.add(selectedNode.id);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const edge of graph.edges) {
        if (edge.source === curr && !outSet.has(edge.target)) {
          outSet.add(edge.target);
          queue.push(edge.target);
        }
      }
    }

    // Transitive Incoming dependencies BFS
    queue = [selectedNode.id];
    inSet.add(selectedNode.id);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const edge of graph.edges) {
        if (edge.target === curr && !inSet.has(edge.source)) {
          inSet.add(edge.source);
          queue.push(edge.source);
        }
      }
    }

    return { outgoingTransitive: outSet, incomingTransitive: inSet };
  }, [selectedNode, graph, dependencyMode]);

  // Compute active edges set based on the selected mode
  const activeEdgesSet = useMemo(() => {
    if (!selectedNode || !graph) return new Set<string>();
    const active = new Set<string>();

    if (dependencyMode === 'all') {
      for (const edge of graph.edges) {
        if (edge.source === selectedNode.id || edge.target === selectedNode.id) {
          active.add(`${edge.source}\0${edge.target}`);
        }
      }
    } else if (dependencyMode === 'outgoing') {
      for (const edge of graph.edges) {
        if (edge.source === selectedNode.id) {
          active.add(`${edge.source}\0${edge.target}`);
        }
      }
    } else if (dependencyMode === 'incoming') {
      for (const edge of graph.edges) {
        if (edge.target === selectedNode.id) {
          active.add(`${edge.source}\0${edge.target}`);
        }
      }
    } else if (dependencyMode === 'impact') {
      for (const edge of graph.edges) {
        const matchesOut = outgoingTransitive.has(edge.source) && outgoingTransitive.has(edge.target);
        const matchesIn = incomingTransitive.has(edge.source) && incomingTransitive.has(edge.target);
        if (matchesOut || matchesIn) {
          active.add(`${edge.source}\0${edge.target}`);
        }
      }
    }
    return active;
  }, [selectedNode, graph, dependencyMode, outgoingTransitive, incomingTransitive]);

  // Compute line positions and colors
  const { positions, colors } = useMemo(() => {
    if (!graph || graph.edges.length === 0) {
      return { positions: new Float32Array(0), colors: new Float32Array(0) };
    }

    const posList: number[] = [];
    const colorList: number[] = [];

    const colorSource = new Color();
    const colorTarget = new Color();

    for (const edge of graph.edges) {
      const sourceNode = nodeById.get(edge.source);
      const targetNode = nodeById.get(edge.target);

      if (!sourceNode || !targetNode) continue;

      const [sx, sy, sz] = sourceNode.position;
      const [tx, ty, tz] = targetNode.position;

      // Determine edge visibility/highlighting
      let opacityFactor = 0.08;
      const isActive = activeEdgesSet.has(`${edge.source}\0${edge.target}`);
      const isAIHighlighted =
        highlightedEdges.has(`${edge.source}\0${edge.target}`) ||
        highlightedEdges.has(`${edge.target}\0${edge.source}`);

      if (isActive) {
        opacityFactor = 0.75; // Selected edge opacity
      } else if (isAIHighlighted) {
        opacityFactor = 0.42; // Related edge opacity
      } else if (selectedNode) {
        opacityFactor = 0.035; // Dim unrelated edges but keep them faintly visible
      }

      posList.push(sx, sy, sz, tx, ty, tz);

      // Color mapping
      let c1 = NODE_COLORS[sourceNode.type] || '#64748b';
      let c2 = NODE_COLORS[targetNode.type] || '#64748b';

      if (selectedNode && isActive) {
        const isOutgoing =
          edge.source === selectedNode.id ||
          (dependencyMode === 'impact' &&
            outgoingTransitive.has(edge.source) &&
            outgoingTransitive.has(edge.target));
            
        const isIncoming =
          edge.target === selectedNode.id ||
          (dependencyMode === 'impact' &&
            incomingTransitive.has(edge.source) &&
            incomingTransitive.has(edge.target));

        if (isOutgoing) {
          c1 = '#E3C78A'; // Muted Amber
          c2 = '#E3C78A';
        } else if (isIncoming) {
          c1 = '#ECE9E1'; // Warm Off-White
          c2 = '#ECE9E1';
        }
      }

      colorSource.set(c1).multiplyScalar(opacityFactor);
      colorTarget.set(c2).multiplyScalar(opacityFactor);

      colorList.push(colorSource.r, colorSource.g, colorSource.b);
      colorList.push(colorTarget.r, colorTarget.g, colorTarget.b);
    }

    return {
      positions: new Float32Array(posList),
      colors: new Float32Array(colorList),
    };
  }, [graph, selectedNode, dependencyMode, activeEdgesSet, highlightedEdges, outgoingTransitive, incomingTransitive, nodeById]);

  // Buffer geometry construction
  const geometry = useMemo(() => {
    const geom = new BufferGeometry();
    if (positions.length > 0) {
      geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
      geom.setAttribute('color', new Float32BufferAttribute(colors, 3));
    }
    return geom;
  }, [positions, colors]);

  // Animate direction particles along active dependency lines
  useFrame((state) => {
    if (!selectedNode || activeEdgesSet.size === 0 || !graph || !pointsRef.current) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.getAttribute('position');
    if (!posAttr) return;

    const t = (state.clock.getElapsedTime() * 0.45) % 1.0;
    let idx = 0;

    for (const edgeKey of activeEdgesSet) {
      const [srcId, tgtId] = edgeKey.split('\0');
      const srcNode = nodeById.get(srcId);
      const tgtNode = nodeById.get(tgtId);

      if (srcNode && tgtNode) {
        const [sx, sy, sz] = srcNode.position;
        const [tx, ty, tz] = tgtNode.position;

        const px = sx + (tx - sx) * t;
        const py = sy + (ty - sy) * t;
        const pz = sz + (tz - sz) * t;

        posAttr.setXYZ(idx, px, py, pz);
        idx++;
      }
    }
    posAttr.needsUpdate = true;
  });

  if (positions.length === 0) return null;

  return (
    <group>
      {/* 3D lines */}
      <lineSegments geometry={geometry}>
        <lineBasicMaterial vertexColors transparent depthWrite={false} />
      </lineSegments>

      {/* Traveling pulses/particles showing direction */}
      {selectedNode && activeEdgesSet.size > 0 && (
        <points
          key={`${selectedNode.id}-${dependencyMode}-${activeEdgesSet.size}`}
          ref={pointsRef}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(activeEdgesSet.size * 3), 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#C56A3A"
            size={1.1}
            sizeAttenuation={true}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}

export default DependencyLines;
