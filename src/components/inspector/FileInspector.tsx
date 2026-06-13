import { useMemo } from 'react';
import { useExplorerStore } from '@/stores/explorer';
import { useNavigatorStore } from '@/stores/navigator';
import { X, Network, FileCode, MessageSquare } from 'lucide-react';
import type { GraphNode } from '@/types/graph';

export function FileInspector() {
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const selectNode = useExplorerStore((s) => s.selectNode);
  const graph = useExplorerStore((s) => s.graph);
  const highlightEdges = useExplorerStore((s) => s.highlightEdges);
  const openChat = useNavigatorStore((s) => s.openChat);
  const addMessage = useNavigatorStore((s) => s.addMessage);

  const dependencies = useMemo(() => {
    if (!graph || !selectedNode) return { imports: [], importedBy: [] };

    const imports: GraphNode[] = [];
    const importedBy: GraphNode[] = [];

    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    for (const edge of graph.edges) {
      if (edge.source === selectedNode.id) {
        const target = nodeMap.get(edge.target);
        if (target) imports.push(target);
      }
      if (edge.target === selectedNode.id) {
        const source = nodeMap.get(edge.source);
        if (source) importedBy.push(source);
      }
    }

    return { imports, importedBy };
  }, [graph, selectedNode]);

  if (!selectedNode) return null;

  const handleTrace = () => {
    if (!graph) return;
    const keys: string[] = [];
    for (const edge of graph.edges) {
      if (edge.source === selectedNode.id || edge.target === selectedNode.id) {
        keys.push(`${edge.source}\0${edge.target}`);
      }
    }
    highlightEdges(keys);
  };

  const handleAskAI = () => {
    openChat();
    addMessage({
      role: 'user',
      content: `Explain the purpose and dependencies of ${selectedNode.id}`,
      timestamp: Date.now(),
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="absolute right-0 top-16 z-20 w-80 max-h-[80vh] overflow-y-auto pointer-events-auto p-4 animate-slide-up">
      <div className="technical-panel rounded shadow-technical p-5 font-mono text-xs text-secondary bg-surface-raised/95">
        <div className="flex justify-between items-center border-b border-primary/5 pb-2 mb-4">
          <div className="flex items-center gap-1.5 text-accent-secondary font-medium tracking-wider">
            <FileCode size={13} />
            <span>FILE INSPECTOR</span>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="text-secondary/60 hover:text-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-[9px] text-secondary/50 uppercase tracking-wider mb-0.5">File Path</div>
            <div className="text-primary font-medium break-all leading-relaxed">{selectedNode.id}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-void border border-primary/5 rounded p-2.5">
            <div>
              <div className="text-[9px] text-secondary/50 tracking-wider">SIZE</div>
              <div className="text-primary font-semibold">{formatSize(selectedNode.size)}</div>
            </div>
            <div>
              <div className="text-[9px] text-secondary/50 tracking-wider">LINES</div>
              <div className="text-primary font-semibold">{selectedNode.lineCount}</div>
            </div>
            <div>
              <div className="text-[9px] text-secondary/50 tracking-wider">TYPE</div>
              <div className="text-primary font-semibold uppercase">{selectedNode.type}</div>
            </div>
            <div>
              <div className="text-[9px] text-secondary/50 tracking-wider">RISK</div>
              <div className={`font-semibold uppercase ${selectedNode.riskLevel === 'high' ? 'text-danger' : selectedNode.riskLevel === 'medium' ? 'text-accent-primary' : 'text-accent-secondary'}`}>
                {selectedNode.riskLevel}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[9px] text-secondary/50 uppercase tracking-wider mb-1.5">Direct Imports ({dependencies.imports.length})</div>
            {dependencies.imports.length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto border border-primary/5 rounded p-1.5 bg-void/50">
                {dependencies.imports.map((imp) => (
                  <button
                    key={imp.id}
                    onClick={() => selectNode(imp)}
                    className="w-full text-left truncate hover:text-accent-selected py-0.5 text-secondary/80 hover:text-primary transition-colors block"
                  >
                    &gt; {imp.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[9px] text-secondary/30">NONE</div>
            )}
          </div>

          <div>
            <div className="text-[9px] text-secondary/50 uppercase tracking-wider mb-1.5">Imported By ({dependencies.importedBy.length})</div>
            {dependencies.importedBy.length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto border border-primary/5 rounded p-1.5 bg-void/50">
                {dependencies.importedBy.map((imp) => (
                  <button
                    key={imp.id}
                    onClick={() => selectNode(imp)}
                    className="w-full text-left truncate hover:text-accent-selected py-0.5 text-secondary/80 hover:text-primary transition-colors block"
                  >
                    &gt; {imp.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[9px] text-secondary/30">NONE</div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-primary/5">
            <button
              onClick={handleTrace}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/35 text-primary rounded text-[9px] font-medium tracking-wider transition-colors"
            >
              <Network size={11} />
              Trace path
            </button>
            <button
              onClick={handleAskAI}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-accent-secondary/15 hover:bg-accent-secondary/25 border border-accent-secondary/30 text-primary rounded text-[9px] font-medium tracking-wider transition-colors"
            >
              <MessageSquare size={11} />
              Ask navigator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default FileInspector;

