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
  const isolatedCluster = useExplorerStore((s) => s.isolatedCluster);
  const graph = useExplorerStore((s) => s.graph);
  
  const inspectorOpen = useExplorerStore((s) => s.inspectorOpen);
  const clustersOpen = useExplorerStore((s) => s.clustersOpen);

  const controlsRef = useRef<any>(null);
  const isDragging = useRef(false);

  // Targets for animation
  const targetPos = useRef<Vector3 | null>(null);
  const targetLookAt = useRef<Vector3 | null>(null);
  const isTransitioning = useRef(false);

  // Helper to calculate HUD centering offset percentages in screen space
  const getCenteringOffsets = () => {
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    const leftOpen = !isMobile && clustersOpen;
    const rightOpen = !isMobile && inspectorOpen && selectedNode;
    
    let pctX = 0;
    let pctY = 0;
    
    if (isMobile) {
      if (inspectorOpen && selectedNode) {
        // Bottom sheet covers bottom 60% of height: shift node up by 25% of height
        pctY = 0.25;
      }
    } else {
      const leftWidth = leftOpen ? 256 : 0;
      const rightWidth = rightOpen ? 320 : 0;
      const visualCenter = leftWidth + (window.innerWidth - leftWidth - rightWidth) / 2;
      const screenCenter = window.innerWidth / 2;
      pctX = (visualCenter - screenCenter) / window.innerWidth;
    }
    
    return { pctX, pctY };
  };

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

      // Logarithmic scale size calculation matching StarField
      const baseScaleLog = 0.6;
      const metric = focusedNode.lineCount || 0;
      const scaleFactor = 0.4;
      let visualScale = baseScaleLog + Math.log1p(metric) * scaleFactor + focusedNode.centrality * 1.5;
      visualScale = Math.max(0.5, Math.min(3.5, visualScale));

      const focusDist = visualScale * 6 + 12;

      // Position back along current camera facing direction
      const dir = new Vector3();
      camera.getWorldDirection(dir);
      if (dir.lengthSq() < 0.1) dir.set(0, 0, -1);
      
      const basePos = new Vector3()
        .copy(focusedNode.position)
        .addScaledVector(dir, -focusDist);

      // Camera local axes
      const camForward = new Vector3().copy(dir).normalize();
      const worldUp = new Vector3(0, 1, 0);
      const camRight = new Vector3().crossVectors(camForward, worldUp).normalize();
      const camUp = new Vector3().crossVectors(camRight, camForward).normalize();

      const fovRad = (camera.fov * Math.PI) / 180;
      const viewportHeight = 2 * Math.tan(fovRad / 2) * focusDist;
      const viewportWidth = viewportHeight * camera.aspect;

      const { pctX, pctY } = getCenteringOffsets();
      const worldShiftX = pctX * viewportWidth;
      const worldShiftY = pctY * viewportHeight;

      targetPos.current = new Vector3()
        .copy(basePos)
        .addScaledVector(camRight, -worldShiftX)
        .addScaledVector(camUp, -worldShiftY);

      targetLookAt.current = new Vector3()
        .copy(focusedNode.position)
        .addScaledVector(camRight, -worldShiftX)
        .addScaledVector(camUp, -worldShiftY);

      isTransitioning.current = true;
    } else if (!isolatedCluster) {
      // Return smoothly to previous state if cleared
      if (previousCameraState) {
        const [px, py, pz] = previousCameraState.position;
        const [tx, ty, tz] = previousCameraState.target;
        targetPos.current = new Vector3(px, py, pz);
        targetLookAt.current = new Vector3(tx, ty, tz);
        isTransitioning.current = true;
      }
    }
  }, [focusedNode]);

  // Handle panel updates to recalculate offsets dynamically
  useEffect(() => {
    if (focusedNode) {
      const baseScaleLog = 0.6;
      const metric = focusedNode.lineCount || 0;
      const scaleFactor = 0.4;
      let visualScale = baseScaleLog + Math.log1p(metric) * scaleFactor + focusedNode.centrality * 1.5;
      visualScale = Math.max(0.5, Math.min(3.5, visualScale));

      const focusDist = visualScale * 6 + 12;

      const dir = new Vector3();
      camera.getWorldDirection(dir);
      if (dir.lengthSq() < 0.1) dir.set(0, 0, -1);
      
      const basePos = new Vector3()
        .copy(focusedNode.position)
        .addScaledVector(dir, -focusDist);

      const camForward = new Vector3().copy(dir).normalize();
      const worldUp = new Vector3(0, 1, 0);
      const camRight = new Vector3().crossVectors(camForward, worldUp).normalize();
      const camUp = new Vector3().crossVectors(camRight, camForward).normalize();

      const fovRad = (camera.fov * Math.PI) / 180;
      const viewportHeight = 2 * Math.tan(fovRad / 2) * focusDist;
      const viewportWidth = viewportHeight * camera.aspect;

      const { pctX, pctY } = getCenteringOffsets();
      const worldShiftX = pctX * viewportWidth;
      const worldShiftY = pctY * viewportHeight;

      targetPos.current = new Vector3()
        .copy(basePos)
        .addScaledVector(camRight, -worldShiftX)
        .addScaledVector(camUp, -worldShiftY);

      targetLookAt.current = new Vector3()
        .copy(focusedNode.position)
        .addScaledVector(camRight, -worldShiftX)
        .addScaledVector(camUp, -worldShiftY);

      isTransitioning.current = true;
    }
  }, [clustersOpen, inspectorOpen, selectedNode]);

  // Handle isolatedCluster changes to zoom/pan to fit the constellation system
  useEffect(() => {
    if (isolatedCluster && graph) {
      const clusterNodes = graph.nodes.filter((n) => n.folder === isolatedCluster);
      if (clusterNodes.length > 0) {
        if (controlsRef.current && !previousCameraState) {
          const currentPos: [number, number, number] = [camera.position.x, camera.position.y, camera.position.z];
          const currentTgt: [number, number, number] = [
            controlsRef.current.target.x,
            controlsRef.current.target.y,
            controlsRef.current.target.z,
          ];
          setPreviousCameraState({ position: currentPos, target: currentTgt });
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        for (const node of clusterNodes) {
          const [nx, ny, nz] = node.position;
          if (nx < minX) minX = nx;
          if (nx > maxX) maxX = nx;
          if (ny < minY) minY = ny;
          if (ny > maxY) maxY = ny;
          if (nz < minZ) minZ = nz;
          if (nz > maxZ) maxZ = nz;
        }

        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const cz = (minZ + maxZ) / 2;

        const dx = maxX - minX;
        const dy = maxY - minY;
        const dz = maxZ - minZ;
        const maxSpan = Math.max(dx, dy, dz, 15);

        const fitDist = maxSpan * 1.35 + 16;

        const dir = new Vector3();
        camera.getWorldDirection(dir);
        if (dir.lengthSq() < 0.1) dir.set(0, 0, -1);
        
        const basePos = new Vector3(cx, cy, cz).addScaledVector(dir, -fitDist);

        const camForward = new Vector3().copy(dir).normalize();
        const worldUp = new Vector3(0, 1, 0);
        const camRight = new Vector3().crossVectors(camForward, worldUp).normalize();
        const camUp = new Vector3().crossVectors(camRight, camForward).normalize();

        const fovRad = (camera.fov * Math.PI) / 180;
        const viewportHeight = 2 * Math.tan(fovRad / 2) * fitDist;
        const viewportWidth = viewportHeight * camera.aspect;

        const { pctX, pctY } = getCenteringOffsets();
        const worldShiftX = pctX * viewportWidth;
        const worldShiftY = pctY * viewportHeight;

        targetPos.current = new Vector3()
          .copy(basePos)
          .addScaledVector(camRight, -worldShiftX)
          .addScaledVector(camUp, -worldShiftY);

        targetLookAt.current = new Vector3(cx, cy, cz)
          .addScaledVector(camRight, -worldShiftX)
          .addScaledVector(camUp, -worldShiftY);

        isTransitioning.current = true;
      }
    } else if (!isolatedCluster && !focusedNode) {
      if (previousCameraState) {
        const [px, py, pz] = previousCameraState.position;
        const [tx, ty, tz] = previousCameraState.target;
        targetPos.current = new Vector3(px, py, pz);
        targetLookAt.current = new Vector3(tx, ty, tz);
        isTransitioning.current = true;
      }
    }
  }, [isolatedCluster, graph]);

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
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lerpFactor = prefersReducedMotion ? 0.95 : 0.08;

    // Transition camera if active
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
          if (!focusedNode && !isolatedCluster) {
            setPreviousCameraState(null);
          }
        }
      }
    } else {
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
