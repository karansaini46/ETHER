import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExplorerStore } from '@/stores/explorer';
import { GalaxyCanvas } from '@/components/galaxy/GalaxyCanvas';
import { ExplorerHUD } from '@/components/explorer/ExplorerHUD';

export function ExplorerPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const graph = useExplorerStore((s) => s.graph);
  const navigate = useNavigate();

  useEffect(() => {
    // If graph is not loaded, redirect to landing to initialize
    if (!graph && analysisId !== 'demo') {
      navigate('/');
    }
  }, [graph, analysisId, navigate]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-void">
      {/* 3D R3F Canvas */}
      <GalaxyCanvas />

      {/* Head Up Display */}
      <ExplorerHUD />
    </div>
  );
}
export default ExplorerPage;
