import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { OrbitControls } from '@react-three/drei';
import { useExplorerStore } from '@/stores/explorer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function CameraController() {
  const { camera } = useThree();
  
  // Store state
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const selectNode = useExplorerStore((s) => s.selectNode);
  const focusedNode = useExplorerStore((s) => s.focusedNode);
  const setFocusedNode = useExplorerStore((s) => s.setFocusedNode);
  const previousCameraState = useExplorerStore((s) => s.previousCameraState);
  const setPreviousCameraState = useExplorerStore((s) => s.setPreviousCameraState);
  const setSearchOpen = useExplorerStore((s) => s.setSearchOpen);

  const controlsRef = useRef<any>(null);
  const isDragging = useRef(false);

  // Targets for animation
  const targetPos = useRef<Vector3 | null>(null);
  const targetLookAt = useRef<Vector3 | null>(null);
  const isTransitioning = useRef(false);

  // Handle focusedNode changes for camera flight
  useEffect(() => {
    if (focusedNode) {
      // Save current state as previous view before transitioning to the new focused node
      if (controlsRef.current && !previousCameraState) {
        const currentPos: [number, number, number] = [camera.position.x, camera.position.y, camera.position.z];
        const currentTgt: [number, number, number] = [
          controlsRef.current.target.x,
          controlsRef.current.target.y,
          controlsRef.current.target.z,
        ];
        setPreviousCameraState({ position: currentPos, target: currentTgt });
      }

      const [x, y, z] = focusedNode.position;
      const size = 0.6 + focusedNode.centrality * 2.5 + Math.min(focusedNode.lineCount / 1000, 1.5);
      const focusDist = size * 5 + 10; // Comfortable distance based on node size

      // Stop comfortable viewing distance offset from node position
      targetPos.current = new Vector3(x, y + focusDist * 0.3, z + focusDist);
      targetLookAt.current = new Vector3(x, y, z);
      isTransitioning.current = true;
    } else {
      // If focusedNode is cleared, smoothly return back to previous state if it exists
      if (previousCameraState) {
        const [px, py, pz] = previousCameraState.position;
        const [tx, ty, tz] = previousCameraState.target;
        targetPos.current = new Vector3(px, py, pz);
        targetLookAt.current = new Vector3(tx, ty, tz);
        isTransitioning.current = true;
      }
    }
  }, [focusedNode]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Escape',
      action: () => {
        if (focusedNode) {
          setFocusedNode(null);
        } else if (selectedNode) {
          selectNode(null);
        }
      },
    },
    {
      key: 'f',
      action: () => {
        if (selectedNode) {
          setFocusedNode(selectedNode);
        }
      },
    },
    {
      key: 'r',
      action: () => {
        setFocusedNode(null);
        selectNode(null);
        setPreviousCameraState(null);
        if (controlsRef.current) {
          targetPos.current = new Vector3(0, 80, 150);
          targetLookAt.current = new Vector3(0, 0, 0);
          isTransitioning.current = true;
        }
      },
    },
    {
      key: '/',
      action: () => {
        setSearchOpen(true);
      },
    },
  ]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lerpFactor = prefersReducedMotion ? 0.95 : 0.08;

    // Transition camera if actively focused or returning
    if (isTransitioning.current && targetPos.current && targetLookAt.current) {
      if (isDragging.current) {
        // Halt automatic movement if user manually overrides by dragging
        isTransitioning.current = false;
      } else {
        camera.position.lerp(targetPos.current, lerpFactor);
        controls.target.lerp(targetLookAt.current, lerpFactor);
        controls.update();

        const posReached = camera.position.distanceTo(targetPos.current) < 0.1;
        const tgtReached = controls.target.distanceTo(targetLookAt.current) < 0.1;

        if (posReached && tgtReached) {
          isTransitioning.current = false;
          if (!focusedNode) {
            setPreviousCameraState(null);
          }
        }
      }
    } else {
      // Standard controls damping update
      controls.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={8}
      maxDistance={400}
      onStart={() => {
        isDragging.current = true;
      }}
      onEnd={() => {
        isDragging.current = false;
      }}
    />
  );
}

export default CameraController;
