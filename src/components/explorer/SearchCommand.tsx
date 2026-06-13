import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useExplorerStore } from '@/stores/explorer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Search, X, Terminal } from 'lucide-react';
import type { GraphNode } from '@/types/graph';

export function SearchCommand() {
  const searchOpen = useExplorerStore((s) => s.searchOpen);
  const setSearchOpen = useExplorerStore((s) => s.setSearchOpen);
  const graph = useExplorerStore((s) => s.graph);
  const selectNode = useExplorerStore((s) => s.selectNode);
  const query = useExplorerStore((s) => s.searchQuery);
  const setQuery = useExplorerStore((s) => s.setSearchQuery);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const activeOptionRef = useRef<HTMLButtonElement>(null);

  // Monitor window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Global keydown listener for '/'
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' && 
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setSearchOpen]);

  const matches = useMemo(() => {
    if (!graph || !query.trim()) return [];
    const lower = query.toLowerCase();
    return graph.nodes
      .filter((n) => n.id.toLowerCase().includes(lower) || n.label.toLowerCase().includes(lower))
      .slice(0, 10);
  }, [graph, query]);

  // Reset active index when query matches change
  useEffect(() => {
    setActiveIndex(0);
  }, [matches]);

  // Auto scroll active option into view inside scroll container
  useEffect(() => {
    if (activeOptionRef.current) {
      activeOptionRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeIndex]);

  if (!searchOpen) return null;

  const handleSelect = (node: GraphNode) => {
    selectNode(node, { source: 'search', focusCamera: true });
    setSearchOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (matches.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + matches.length) % matches.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const node = matches[activeIndex];
      if (node) {
        handleSelect(node);
      }
    }
  };

  // String message for screen reader announcements
  const announcementText = matches.length > 0 && matches[activeIndex]
    ? `Result ${activeIndex + 1} of ${matches.length}: ${matches[activeIndex].label}, ${matches[activeIndex].language}`
    : 'No matches';

  return (
    <div 
      className={
        isMobile
          ? 'fixed top-16 left-0 right-0 z-search-overlay bg-surface-raised/95 border-b border-border-hairline p-4 pointer-events-auto shadow-2xl flex flex-col font-mono text-xs select-none'
          : 'fixed right-6 top-20 w-80 z-search-overlay bg-surface-raised/95 border border-border-hairline rounded p-4 pointer-events-auto shadow-technical flex flex-col font-mono text-xs animate-slide-up select-none'
      }
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3 border-b border-primary/5 pb-2 shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] text-accent-secondary font-medium tracking-wider">
          <Search size={12} className="text-accent-primary" />
          <span>SEARCH FILES</span>
        </div>
        <button
          onClick={() => setSearchOpen(false)}
          className="text-secondary/60 hover:text-primary transition-colors"
          aria-label="Close search panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Input */}
      <div className="relative shrink-0">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type file name or path..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          autoFocus
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-autocomplete="list"
          aria-controls="search-results-list"
          aria-activedescendant={matches[activeIndex] ? `opt-${matches[activeIndex].id}` : undefined}
          className="w-full px-3 py-2 bg-void border border-primary/10 focus:border-accent-selected/50 text-primary rounded font-mono text-xs outline-none transition-colors"
        />
      </div>

      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {query ? announcementText : ''}
      </div>

      {/* Results List */}
      {query && (
        <div 
          id="search-results-list"
          role="listbox"
          className="mt-3 space-y-1 max-h-48 overflow-y-auto hud-scrollbar pr-0.5"
        >
          {matches.length > 0 ? (
            matches.map((node, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={node.id}
                  id={`opt-${node.id}`}
                  ref={isActive ? activeOptionRef : null}
                  onClick={() => handleSelect(node)}
                  role="option"
                  aria-selected={isActive}
                  className={`w-full flex items-center justify-between p-2.5 rounded text-left text-[11px] transition-all border outline-none ${
                    isActive 
                      ? 'bg-accent-primary/10 border-accent-primary/35 text-primary' 
                      : 'bg-void/50 border-primary/5 hover:border-primary/20 text-secondary'
                  }`}
                >
                  <div className="truncate pr-3">
                    <div className="font-semibold flex items-center gap-1">
                      <Terminal size={10} className={isActive ? 'text-accent-primary' : 'text-secondary/40'} />
                      <span className="truncate">{node.label}</span>
                    </div>
                    <div className="text-[9px] text-secondary/40 truncate mt-0.5">{node.id}</div>
                  </div>
                  <div className="text-[8.5px] uppercase px-1.5 py-0.5 bg-surface-secondary border border-primary/5 rounded shrink-0">
                    {node.language || 'Unknown'}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-6 text-[10px] text-secondary/40">
              NO FILES FOUND FOR "{query.toUpperCase()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchCommand;
