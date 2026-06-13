import { EffectComposer, Bloom } from '@react-three/postprocessing';

export function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        height={300}
        intensity={0.35}
      />
    </EffectComposer>
  );
}
export default PostProcessing;
