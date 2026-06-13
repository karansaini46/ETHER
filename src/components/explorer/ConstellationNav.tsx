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
      <div className="glass-panel border-slate-800 rounded-lg p-5 font-mono text-xs text-slate-300">
        <div className="flex items-center gap-1.5 text-cyber-purple font-bold tracking-wider border-b border-slate-800 pb-2 mb-4">
          <Layers size={14} />
          <span>CONSTELLATIONS</span>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => isolateCluster(null)}
            className={`w-full flex items-center gap-2 p-2 rounded text-left transition-colors border ${!isolatedCluster ? 'bg-cyber-purple/20 border-cyber-purple text-white' : 'bg-transparent border-transparent hover:bg-slate-900 text-slate-400'}`}
          >
            <Network size={12} className={!isolatedCluster ? 'text-cyber-purple' : 'text-slate-600'} />
            <span className="truncate uppercase font-bold text-[10px]">Show All Systems</span>
          </button>

          {folders.map((folder) => {
            const isIsolated = isolatedCluster === folder;
            return (
              <button
                key={folder}
                onClick={() => isolateCluster(folder)}
                className={`w-full flex items-center gap-2 p-2 rounded text-left transition-all border ${isIsolated ? 'bg-cyber-purple/20 border-cyber-purple text-white' : 'bg-transparent border-transparent hover:bg-slate-900 text-slate-400'}`}
              >
                {isIsolated ? (
                  <Folder size={12} className="text-cyber-purple shrink-0" />
                ) : (
                  <FolderClosed size={12} className="text-slate-600 shrink-0" />
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
