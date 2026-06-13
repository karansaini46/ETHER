import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { usePreferencesStore } from '@/stores/preferences';
import { CameraController } from './CameraController';
import { StarField } from './StarField';
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

  return (
    <div className="absolute inset-0 w-full h-full bg-void overflow-hidden">
      <Canvas
        camera={{ position: [0, 80, 150], fov: 60, near: 0.1, far: 1000 }}
        dpr={getDpr()}
        gl={{
          antialias: quality !== 'low',
          powerPreference: 'high-performance',
          depth: true,
          alpha: false,
        }}
      >
        <color attach="background" args={['#020204']} />
        
        {/* Ambient lighting */}
        <ambientLight intensity={0.25} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />

        <Suspense fallback={null}>
          <StarField />
          {showLines && <DependencyLines />}
          <SelectionRing />
          {showActivity && <BackgroundParticles />}
          {quality !== 'low' && <PostProcessing />}
        </Suspense>

        <CameraController />
      </Canvas>
    </div>
  );
}
export default GalaxyCanvas;
