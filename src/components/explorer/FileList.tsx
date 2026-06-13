import React, { useMemo, useRef } from 'react';
import { useExplorerStore } from '@/stores/explorer';
import { FileCode, Terminal } from 'lucide-react';

export function FileList() {
  const graph = useExplorerStore((s) => s.graph);
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const selectNode = useExplorerStore((s) => s.selectNode);
  const setFocusedNode = useExplorerStore((s) => s.setFocusedNode);
  const isolatedCluster = useExplorerStore((s) => s.isolatedCluster);

  const listRef = useRef<HTMLDivElement>(null);

  // Filter and sort the files within the currently active system/cluster
  const files = useMemo(() => {
    if (!graph) return [];
    const list = isolatedCluster
      ? graph.nodes.filter((n) => n.folder === isolatedCluster || n.id === isolatedCluster)
      : graph.nodes;

    return [...list].sort((a, b) => {
      if (a.folder !== b.folder) {
        return a.folder.localeCompare(b.folder);
      }
      return a.label.localeCompare(b.label);
    });
  }, [graph, isolatedCluster]);

  // Handle accessibility keyboard inputs (Up/Down arrows to focus, Enter/Space to select)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const items = listRef.current?.querySelectorAll('[role="option"]');
    if (!items) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % items.length;
      (items[nextIndex] as HTMLElement).focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + items.length) % items.length;
      (items[prevIndex] as HTMLElement).focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const node = files[index];
      if (node) {
        selectNode(node);
        setFocusedNode(node);
      }
    }
  };

  if (files.length === 0) return null;

  return (
    <div className="mt-4 border-t border-primary/5 pt-4">
      <div className="flex items-center gap-1.5 text-accent-secondary font-medium tracking-wider mb-2 uppercase text-[10px]">
        <FileCode size={11} className="text-accent-primary" />
        <span>CONSTELLATION FILES ({files.length})</span>
      </div>

      <div
        ref={listRef}
        role="listbox"
        aria-label="Constellation files keyboard navigation panel"
        className="space-y-0.5 max-h-48 overflow-y-auto border border-primary/5 rounded p-1 bg-void/30 outline-none focus-within:border-accent-primary/20"
      >
        {files.map((node, index) => {
          const isSelected = selectedNode?.id === node.id;
          return (
            <div
              key={node.id}
              role="option"
              aria-selected={isSelected}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onClick={() => {
                selectNode(node);
                setFocusedNode(node);
              }}
              className={`w-full flex items-center gap-2 p-1.5 rounded text-left cursor-pointer transition-all outline-none focus:bg-accent-primary/5 focus:text-primary ${
                isSelected
                  ? 'bg-accent-primary/10 text-primary border-l-2 border-accent-primary pl-1 font-semibold'
                  : 'text-secondary/70 hover:bg-surface-secondary hover:text-secondary'
              }`}
            >
              <Terminal
                size={9}
                className={isSelected ? 'text-accent-primary shrink-0' : 'text-secondary/30 shrink-0'}
              />
              <span className="truncate text-[9.5px] font-mono">{node.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FileList;
