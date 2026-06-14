import { useMemo, useState } from 'react';
import { useExplorerStore } from '@/stores/explorer';
import { Network, Folder, FolderClosed, Layers, HelpCircle, ChevronDown } from 'lucide-react';
import { FileList } from './FileList';

export function ConstellationNav() {
  const graph = useExplorerStore((s) => s.graph);
  const activeConstellationPath = useExplorerStore((s) => s.activeConstellationPath);
  const isolateCluster = useExplorerStore((s) => s.isolateCluster);

  const [legendOpen, setLegendOpen] = useState(false);

  const encodings = [
    { label: 'entry point', color: 'bg-[#ECE9E1] border-[#ECE9E1]/50' },
    { label: 'component', color: 'bg-[#A8AF86] border-[#A8AF86]/50' },
    { label: 'utility / logic', color: 'bg-[#ECE9E1] border-[#ECE9E1]/50' },
    { label: 'state store', color: 'bg-[#E3C78A] border-[#E3C78A]/50' },
    { label: 'layout / style', color: 'bg-[#97958E] border-[#97958E]/50' },
    { label: 'config file', color: 'bg-[#6E6B64] border-[#6E6B64]/50' },
    { label: 'test file', color: 'bg-[#A8AF86] border-[#A8AF86]/50' },
    { label: 'critical issue', color: 'bg-[#C6504B] border-[#C6504B]/50 animate-pulse' },
  ];

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
    <div className="technical-panel rounded shadow-technical p-5 font-mono text-xs text-secondary bg-surface-raised/95 h-full flex flex-col min-h-0 border border-border-hairline select-none">
      
      {/* Sticky Header */}
      <div className="flex items-center gap-1.5 text-accent-secondary font-medium tracking-wider border-b border-primary/5 pb-2 mb-4 shrink-0">
        <Layers size={12} className="text-accent-primary" />
        <span>SYSTEM CLUSTERS</span>
      </div>

      {/* Main scrollable body wrapper */}
      <div className="flex-1 overflow-y-auto hud-scrollbar pr-1 min-h-0 flex flex-col">
        
        {/* Reset System Isolation Toggle */}
        <button
          onClick={() => isolateCluster(null)}
          className={`w-full flex items-center gap-2 p-2 rounded text-left transition-colors border shrink-0 ${
            !activeConstellationPath 
              ? 'bg-accent-primary/10 border-accent-primary/45 text-primary font-medium' 
              : 'bg-transparent border-transparent hover:bg-surface-secondary text-secondary'
          }`}
        >
          <Network size={11} className={!activeConstellationPath ? 'text-accent-primary' : 'text-secondary/40'} />
          <span className="truncate text-[10px]">Show All Systems</span>
        </button>

        {/* Folder items */}
        <div className="space-y-0.5 mt-2 shrink-0">
          {folders.map((folder) => {
            const isIsolated = activeConstellationPath === folder;
            return (
              <button
                key={folder}
                onClick={() => isolateCluster(folder)}
                title={folder}
                className={`w-full flex items-center gap-2 p-1.5 rounded text-left transition-all border ${
                  isIsolated 
                    ? 'bg-accent-primary/10 border-accent-primary/45 text-primary font-semibold' 
                    : 'bg-transparent border-transparent hover:bg-surface-secondary text-secondary'
                }`}
              >
                {isIsolated ? (
                  <Folder size={11} className="text-accent-primary shrink-0" />
                ) : (
                  <FolderClosed size={11} className="text-secondary/40 shrink-0" />
                )}
                <span className="truncate text-[10px] pl-0.5">{folder}</span>
              </button>
            );
          })}
        </div>

        {/* Nested File List */}
        <FileList />
      </div>

      {/* Sticky/Fixed Footer containing System Legend */}
      <div className="border-t border-primary/5 pt-3 mt-3 shrink-0 font-mono text-[9px]">
        {legendOpen && (
          <div className="mb-2.5 space-y-1.5 bg-void/40 p-2 border border-primary/5 rounded animate-slide-up">
            <div className="flex justify-between items-center mb-1.5 border-b border-primary/5 pb-1">
              <span className="font-semibold text-accent-secondary uppercase tracking-wider text-[8px] flex items-center gap-1">
                <HelpCircle size={10} />
                <span>System Encodings</span>
              </span>
              <button onClick={() => setLegendOpen(false)} className="text-secondary/60 hover:text-primary">
                <ChevronDown size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto hud-scrollbar pr-0.5">
              {encodings.map((enc, i) => (
                <div key={i} className="flex items-center gap-1.5 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full border shrink-0 ${enc.color}`} />
                  <span className="text-[8px] uppercase tracking-wider text-secondary/70 truncate">{enc.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!legendOpen ? (
          <button
            onClick={() => setLegendOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-surface-secondary hover:bg-surface-secondary/85 border border-primary/10 text-secondary hover:text-primary rounded uppercase tracking-wider transition-all font-bold text-[8px]"
          >
            <HelpCircle size={11} className="text-accent-secondary animate-pulse" />
            <span>System Legend</span>
          </button>
        ) : (
          <div className="text-[8px] text-secondary/40 leading-relaxed uppercase text-center mt-0.5">
            Drag or WASD to navigate. Scroll to zoom.
          </div>
        )}
      </div>

    </div>
  );
}

export default ConstellationNav;
