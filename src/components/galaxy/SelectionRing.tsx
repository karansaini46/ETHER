import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { useExplorerStore } from '@/stores/explorer';
import { calculateNodeScale } from './StarField';

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
          // 600ms one-time pulse scaling up to 1.12x (pulseScale: 1.0 -> 1.12 -> 1.0)
          pulseScale = 1.0 + Math.sin((elapsed / 0.6) * Math.PI) * 0.12;
        }

        const baseScale = calculateNodeScale(selectedNode.lineCount);
        let finalNodeRadius = baseScale * 1.15 * pulseScale;
        finalNodeRadius = Math.min(1.9, finalNodeRadius);

        let ringRadius = finalNodeRadius * 1.55;
        // Clamp ring radius between 0.8 and 2.5
        ringRadius = Math.max(0.8, Math.min(2.5, ringRadius));

        meshRef.current.scale.set(ringRadius, ringRadius, ringRadius);
      }
    }
  });

  if (!selectedNode) return null;

  const [x, y, z] = selectedNode.position;

  return (
    <mesh ref={meshRef} position={[x, y, z]}>
      {/* Set base unit radius to 1 so scale handles dimensions exactly, thin ring tube */}
      <torusGeometry args={[1, 0.015, 8, 32]} />
      <meshBasicMaterial color="#C56A3A" wireframe />
    </mesh>
  );
}

export default SelectionRing;
