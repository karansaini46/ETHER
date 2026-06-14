import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExplorerStore } from '@/stores/explorer';
import { GalaxyCanvas } from '@/components/galaxy/GalaxyCanvas';
import { ExplorerHUD } from '@/components/explorer/ExplorerHUD';

export function ExplorerPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const graph = useExplorerStore((s) => s.graph);
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // If graph is not loaded, redirect to landing to initialize
    if (!graph && analysisId !== 'demo') {
      navigate('/');
    } else {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [graph, analysisId, navigate]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-void">
      {/* 3D R3F Canvas */}
      <GalaxyCanvas />

      {/* Head Up Display */}
      <ExplorerHUD />

      {/* Lightweight transition layer using ETHER visual design system */}
      {!isReady && (
        <div className="absolute inset-0 bg-void z-[9999] flex flex-col items-center justify-center font-mono text-xs text-accent-secondary">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-secondary border-t-transparent mb-4" />
          <div className="tracking-widest">ESTABLISHING ORBITAL PLOT…</div>
        </div>
      )}
    </div>
  );
}
export default ExplorerPage;
