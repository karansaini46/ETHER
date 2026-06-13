import { useEffect, useState } from 'react';

export function useWebGLSupport(): boolean {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setIsSupported(support);
    } catch {
      setIsSupported(false);
    }
  }, []);

  return isSupported;
}
