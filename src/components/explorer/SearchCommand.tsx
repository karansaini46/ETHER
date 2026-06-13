import { useState, useMemo } from 'react';
import { useExplorerStore } from '@/stores/explorer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Search, X } from 'lucide-react';
import type { GraphNode } from '@/types/graph';

export function SearchCommand() {
  const searchOpen = useExplorerStore((s) => s.searchOpen);
  const setSearchOpen = useExplorerStore((s) => s.setSearchOpen);
  const graph = useExplorerStore((s) => s.graph);
  const selectNode = useExplorerStore((s) => s.selectNode);

  const [query, setQuery] = useState('');

  // Keyboard shortcut listener to toggle search open/close
  useKeyboardShortcuts([
    {
      key: 'k',
      meta: true,
      action: () => setSearchOpen(!searchOpen),
    },
    {
      key: 'Escape',
      action: () => setSearchOpen(false),
    },
  ]);

  const matches = useMemo(() => {
    if (!graph || !query.trim()) return [];
    const lower = query.toLowerCase();
    return graph.nodes
      .filter((n) => n.id.toLowerCase().includes(lower) || n.label.toLowerCase().includes(lower))
      .slice(0, 10);
  }, [graph, query]);

  if (!searchOpen) return null;

  const handleSelect = (node: GraphNode) => {
    selectNode(node);
    setSearchOpen(false);
    setQuery('');
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
      <div className="w-full max-w-lg glass-panel-heavy border-cyber-blue/30 shadow-neon-blue rounded-lg p-6 font-mono">
        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs text-cyber-blue font-bold tracking-wider">
            <Search size={14} />
            <span>SEARCH COGNITIVE DATABASE</span>
          </div>
          <button
            onClick={() => setSearchOpen(false)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <input
          type="text"
          placeholder="Type file name or path..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full px-4 py-3 bg-black/55 border border-slate-800 focus:border-cyber-blue text-white rounded font-mono text-sm shadow-inner transition-colors outline-none"
        />

        {query && (
          <div className="mt-4 space-y-1.5 max-h-60 overflow-y-auto">
            {matches.length > 0 ? (
              matches.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleSelect(node)}
                  className="w-full flex items-center justify-between p-3 bg-slate-950/40 hover:bg-cyber-blue/10 border border-slate-900 hover:border-cyber-blue/40 rounded text-left text-xs text-slate-300 hover:text-white transition-all"
                >
                  <div className="truncate pr-4">
                    <div className="font-semibold">{node.label}</div>
                    <div className="text-[10px] text-slate-500 truncate">{node.id}</div>
                  </div>
                  <div className="text-[10px] uppercase px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-bold">
                    {node.language}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-600">
                NO COORDINATES FOUND FOR "{query}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default SearchCommand;
