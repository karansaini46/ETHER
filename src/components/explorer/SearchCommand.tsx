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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
      <div className="w-full max-w-lg technical-panel shadow-technical rounded p-6 font-mono bg-surface-raised/95">
        <div className="flex justify-between items-center mb-4 border-b border-primary/5 pb-3">
          <div className="flex items-center gap-2 text-[10px] text-accent-secondary font-medium tracking-wider">
            <Search size={12} />
            <span>SEARCH REPOSITORY FILES</span>
          </div>
          <button
            onClick={() => setSearchOpen(false)}
            className="text-secondary hover:text-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <input
          type="text"
          placeholder="Type file name or path..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full px-4 py-3 bg-void border border-primary/10 focus:border-accent-selected/50 text-primary rounded font-mono text-xs shadow-inner transition-colors outline-none"
        />

        {query && (
          <div className="mt-4 space-y-1.5 max-h-60 overflow-y-auto">
            {matches.length > 0 ? (
              matches.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleSelect(node)}
                  className="w-full flex items-center justify-between p-3 bg-void hover:bg-surface-secondary border border-primary/5 hover:border-accent-selected/35 rounded text-left text-xs text-secondary hover:text-primary transition-all"
                >
                  <div className="truncate pr-4">
                    <div className="font-semibold text-primary/90">{node.label}</div>
                    <div className="text-[10px] text-secondary/60 truncate">{node.id}</div>
                  </div>
                  <div className="text-[9px] uppercase px-1.5 py-0.5 bg-surface-secondary border border-primary/5 rounded font-medium text-secondary">
                    {node.language}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-secondary/40">
                NO FILES FOUND FOR "{query}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default SearchCommand;

