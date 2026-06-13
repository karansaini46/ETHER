import { useMemo } from 'react';
import { useExplorerStore } from '@/stores/explorer';
import { Network, Folder, FolderClosed, Layers } from 'lucide-react';

export function ConstellationNav() {
  const graph = useExplorerStore((s) => s.graph);
  const isolatedCluster = useExplorerStore((s) => s.isolatedCluster);
  const isolateCluster = useExplorerStore((s) => s.isolateCluster);

  const folders = useMemo(() => {
    if (!graph) return [];
    // Collect unique folders
    const set = new Set<string>();
    for (const node of graph.nodes) {
      if (node.folder && node.folder !== '/') {
        set.add(node.folder);
      }
    }
    return Array.from(set).sort();
  }, [graph]);

  if (folders.length === 0) return null;

  return (
    <div className="absolute left-0 top-16 z-20 w-64 max-h-[80vh] overflow-y-auto pointer-events-auto p-4 animate-slide-up">
      <div className="technical-panel rounded shadow-technical p-5 font-mono text-xs text-secondary bg-surface-raised/95">
        <div className="flex items-center gap-1.5 text-accent-secondary font-medium tracking-wider border-b border-primary/5 pb-2 mb-4">
          <Layers size={12} />
          <span>SYSTEM CLUSTERS</span>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => isolateCluster(null)}
            className={`w-full flex items-center gap-2 p-2 rounded text-left transition-colors border ${!isolatedCluster ? 'bg-accent-primary/10 border-accent-primary/45 text-primary font-medium' : 'bg-transparent border-transparent hover:bg-surface-secondary text-secondary'}`}
          >
            <Network size={11} className={!isolatedCluster ? 'text-accent-primary' : 'text-secondary/40'} />
            <span className="truncate text-[10px]">Show All Systems</span>
          </button>

          {folders.map((folder) => {
            const isIsolated = isolatedCluster === folder;
            return (
              <button
                key={folder}
                onClick={() => isolateCluster(folder)}
                className={`w-full flex items-center gap-2 p-2 rounded text-left transition-all border ${isIsolated ? 'bg-accent-primary/10 border-accent-primary/45 text-primary font-medium' : 'bg-transparent border-transparent hover:bg-surface-secondary text-secondary'}`}
              >
                {isIsolated ? (
                  <Folder size={11} className="text-accent-primary shrink-0" />
                ) : (
                  <FolderClosed size={11} className="text-secondary/40 shrink-0" />
                )}
                <span className="truncate text-[10px]">{folder}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default ConstellationNav;

