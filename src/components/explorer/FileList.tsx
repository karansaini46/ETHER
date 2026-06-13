import React, { useMemo, useRef, useEffect } from 'react';
import { useExplorerStore } from '@/stores/explorer';
import { FileCode, Terminal } from 'lucide-react';

export function FileList() {
  const graph = useExplorerStore((s) => s.graph);
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const selectNode = useExplorerStore((s) => s.selectNode);
  const isolatedCluster = useExplorerStore((s) => s.isolatedCluster);

  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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

  // Automatically scroll selected node into view without stealing browser focus
  useEffect(() => {
    if (selectedNode) {
      const el = itemRefs.current.get(selectedNode.id);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedNode]);

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
        selectNode(node, { source: 'sidebar', focusCamera: true });
      }
    }
  };

  if (files.length === 0) return null;

  return (
    <div className="mt-4 border-t border-primary/5 pt-4 flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-1.5 text-accent-secondary font-medium tracking-wider mb-2 uppercase text-[10px] shrink-0">
        <FileCode size={11} className="text-accent-primary" />
        <span>CONSTELLATION FILES ({files.length})</span>
      </div>

      <div
        ref={listRef}
        role="listbox"
        aria-label="Constellation files keyboard navigation panel"
        className="space-y-0.5 overflow-y-auto border border-primary/5 rounded p-1 bg-void/30 outline-none focus-within:border-accent-primary/20 flex-1 min-h-0 hud-scrollbar"
      >
        {files.map((node, index) => {
          const isSelected = selectedNode?.id === node.id;
          return (
            <div
              key={node.id}
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(node.id, el);
                } else {
                  itemRefs.current.delete(node.id);
                }
              }}
              role="option"
              aria-selected={isSelected}
              title={node.id}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onClick={() => {
                selectNode(node, { source: 'sidebar', focusCamera: true });
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
