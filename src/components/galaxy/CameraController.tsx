import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion } from 'three';
import { useExplorerStore } from '@/stores/explorer';

export function CameraController() {
  const { camera, gl } = useThree();
  const selectedNode = useExplorerStore((s) => s.selectedNode);

  // Targets for animation
  const targetPos = useRef<Vector3 | null>(null);
  const targetLookAt = useRef<Vector3 | null>(null);
  const isTransitioning = useRef(false);

  // Keyboard state for WASD movement
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside text input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      keys.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // When selectedNode changes, set target position & lookAt
  useEffect(() => {
    if (selectedNode) {
      const [x, y, z] = selectedNode.position;
      // Position camera slightly offset from the selected star
      targetPos.current = new Vector3(x, y + 10, z + 25);
      targetLookAt.current = new Vector3(x, y, z);
      isTransitioning.current = true;
    }
  }, [selectedNode]);

  useFrame((_, delta) => {
    // 1. Smoothly transition camera if selectedNode changes
    if (isTransitioning.current && targetPos.current && targetLookAt.current) {
      camera.position.lerp(targetPos.current, 0.08);

      // Create matrix to look at targetLookAt
      const currentDir = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const targetDir = new Vector3()
        .subVectors(targetLookAt.current, camera.position)
        .normalize();

      currentDir.lerp(targetDir, 0.08);
      
      new Quaternion().setFromRotationMatrix(
        gl.domElement.style ? camera.matrix : camera.matrixWorld
      );
      camera.lookAt(targetLookAt.current);

      if (camera.position.distanceTo(targetPos.current) < 0.1) {
        isTransitioning.current = false;
      }
      return;
    }

    // 2. Keyboard flight movement when NOT transitioning
    const speed = keys.current['ShiftLeft'] || keys.current['ShiftRight'] ? 60 : 20;
    const move = new Vector3();

    if (keys.current['KeyW']) move.z -= 1;
    if (keys.current['KeyS']) move.z += 1;
    if (keys.current['KeyA']) move.x -= 1;
    if (keys.current['KeyD']) move.x += 1;
    if (keys.current['KeyQ']) move.y -= 1;
    if (keys.current['KeyE']) move.y += 1;

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * delta);
      // Apply camera orientation to movement vector
      move.applyQuaternion(camera.quaternion);
      camera.position.add(move);
    }
  });

  return null;
}
export default CameraController;
