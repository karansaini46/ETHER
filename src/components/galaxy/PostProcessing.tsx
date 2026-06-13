import { EffectComposer, Bloom } from '@react-three/postprocessing';

export function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.15}
        luminanceSmoothing={0.9}
        height={300}
        intensity={1.2}
      />
    </EffectComposer>
  );
}
export default PostProcessing;
