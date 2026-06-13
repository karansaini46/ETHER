import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { useExplorerStore } from '@/stores/explorer';

export function SelectionRing() {
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.5;
      meshRef.current.rotation.z += delta * 0.8;
    }
  });

  if (!selectedNode) return null;

  const [x, y, z] = selectedNode.position;
  const size = 0.6 + selectedNode.centrality * 2.5 + Math.min(selectedNode.lineCount / 1000, 1.5);

  return (
    <mesh ref={meshRef} position={[x, y, z]}>
      <torusGeometry args={[size * 1.5, 0.05, 8, 24]} />
      <meshBasicMaterial color="#00d4ff" wireframe />
    </mesh>
  );
}
export default SelectionRing;
