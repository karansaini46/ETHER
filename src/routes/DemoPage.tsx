import { useEffect } from 'react';
import { useExplorerStore } from '@/stores/explorer';
import { demoGraph } from '@/data/demo-graph';
import { GalaxyCanvas } from '@/components/galaxy/GalaxyCanvas';
import { ExplorerHUD } from '@/components/explorer/ExplorerHUD';

export function DemoPage() {
  const setGraph = useExplorerStore((s) => s.setGraph);
  const graph = useExplorerStore((s) => s.graph);

  useEffect(() => {
    // Populate store with static demo graph data
    setGraph(demoGraph, true);

    return () => {
      // Clear graph on unmount
      // setGraph(null);
    };
  }, [setGraph]);

  if (!graph) {
    return (
      <div className="flex h-screen w-screen items-center justify-center font-mono text-xs text-accent-secondary bg-void">
        Loading demo visualization...
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-void">
      {/* 3D R3F Canvas */}
      <GalaxyCanvas />

      {/* Head Up Display */}
      <ExplorerHUD />
    </div>
  );
}
export default DemoPage;
