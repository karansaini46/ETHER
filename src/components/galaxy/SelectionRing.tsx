import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { useExplorerStore } from '@/stores/explorer';

export function SelectionRing() {
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const meshRef = useRef<Mesh>(null);

  const lastSelectionTime = useRef(0);
  const prevSelectedId = useRef<string | null>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.5;
      meshRef.current.rotation.z += delta * 0.8;
      
      // Update pulse animation scale on the selection ring mesh
      if (selectedNode) {
        if (selectedNode.id !== prevSelectedId.current) {
          prevSelectedId.current = selectedNode.id;
          lastSelectionTime.current = state.clock.getElapsedTime();
        }

        const elapsed = state.clock.getElapsedTime() - lastSelectionTime.current;
        let pulseScale = 1.0;
        if (elapsed < 0.6) {
          pulseScale = 1.0 + Math.sin((elapsed / 0.6) * Math.PI) * 0.35;
        }

        // Base logarithmic scale
        const baseScaleLog = 0.6;
        const metric = selectedNode.lineCount || 0;
        const scaleFactor = 0.4;
        let visualScale = baseScaleLog + Math.log1p(metric) * scaleFactor + selectedNode.centrality * 1.5;
        visualScale = Math.max(0.5, Math.min(3.5, visualScale));

        const ringScale = visualScale * 1.35 * pulseScale;
        meshRef.current.scale.set(ringScale, ringScale, ringScale);
      }
    }
  });

  if (!selectedNode) return null;

  const [x, y, z] = selectedNode.position;

  return (
    <mesh ref={meshRef} position={[x, y, z]}>
      {/* Set base unit radius to 1 so scale handles dimensions exactly */}
      <torusGeometry args={[1, 0.04, 8, 32]} />
      <meshBasicMaterial color="#C56A3A" wireframe />
    </mesh>
  );
}

export default SelectionRing;
