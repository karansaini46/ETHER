import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { usePreferencesStore } from '@/stores/preferences';
import { useExplorerStore } from '@/stores/explorer';
import { CameraController } from './CameraController';
import { StarField } from './StarField';
import { NodeIcons } from './NodeIcons';
import { DependencyLines } from './DependencyLines';
import { SelectionRing } from './SelectionRing';
import { PostProcessing } from './PostProcessing';
import { BackgroundParticles } from './BackgroundParticles';

export function GalaxyCanvas() {
  const quality = usePreferencesStore((s) => s.quality);

  const getDpr = () => {
    if (quality === 'low') return 1;
    if (quality === 'balanced') return [1, 1.5] as [number, number];
    return [1, 2] as [number, number]; // high / auto
  };

  const showLines = usePreferencesStore((s) => s.showDependencyLines);
  const showActivity = usePreferencesStore((s) => s.showActivityEffects);
  
  // Selection/Hover state
  const hoveredNode = useExplorerStore((s) => s.hoveredNode);
  const selectNode = useExplorerStore((s) => s.selectNode);
  const setFocusedNode = useExplorerStore((s) => s.setFocusedNode);

  return (
    <div 
      className="absolute inset-0 w-full h-full bg-void overflow-hidden select-none"
      style={{ touchAction: 'none' }} // Prevents browser scrolling/gestures on mobile touch
    >
      <Canvas
        camera={{ position: [0, 80, 150], fov: 60, near: 0.1, far: 1000 }}
        dpr={getDpr()}
        gl={{
          antialias: quality !== 'low',
          powerPreference: 'high-performance',
          depth: true,
          alpha: false,
        }}
        onPointerMissed={() => {
          // Clear selection when clicking empty space
          selectNode(null);
          setFocusedNode(null);
        }}
      >
        <color attach="background" args={['#020204']} />
        
        {/* Ambient lighting */}
        <ambientLight intensity={0.25} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />

        <Suspense fallback={null}>
          <StarField />
          <NodeIcons />
          {showLines && <DependencyLines />}
          <SelectionRing />
          {showActivity && <BackgroundParticles />}
          {quality !== 'low' && <PostProcessing />}

          {/* Render compact tooltip for hovered node, projected in 3D */}
          {hoveredNode && (
            <Html
              position={[hoveredNode.position[0], hoveredNode.position[1] + 1.2, hoveredNode.position[2]]}
              center
              distanceFactor={35} // Dynamic text scaling based on camera distance
            >
              <div className="galaxy-node-label pointer-events-none select-none shadow-technical text-left min-w-[150px]">
                <div className="font-bold text-accent-primary text-[10px] truncate">{hoveredNode.fileName}</div>
                <div className="text-secondary/75 text-[8px] mt-0.5 truncate max-w-[220px]">{hoveredNode.displayPath}</div>
              </div>
            </Html>
          )}
        </Suspense>

        <CameraController />
      </Canvas>
    </div>
  );
}

export default GalaxyCanvas;
