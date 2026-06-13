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
      <div className="glass-panel border-slate-800 rounded-lg p-5 font-mono text-xs text-slate-300">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
          <div className="flex items-center gap-1.5 text-cyber-blue font-bold tracking-wider">
            <FileCode size={14} />
            <span>FILE INSPECTOR</span>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-[10px] text-slate-500 uppercase">File Path</div>
            <div className="text-white font-semibold break-all leading-relaxed">{selectedNode.id}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-black/30 border border-slate-900 rounded p-2.5">
            <div>
              <div className="text-[10px] text-slate-500">SIZE</div>
              <div className="text-white font-bold">{formatSize(selectedNode.size)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">LINES</div>
              <div className="text-white font-bold">{selectedNode.lineCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">TYPE</div>
              <div className="text-white font-bold uppercase">{selectedNode.type}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">RISK</div>
              <div className={`font-bold uppercase ${selectedNode.riskLevel === 'high' ? 'text-cyber-red' : selectedNode.riskLevel === 'medium' ? 'text-cyber-amber' : 'text-cyber-green'}`}>
                {selectedNode.riskLevel}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase mb-1.5">Direct Imports ({dependencies.imports.length})</div>
            {dependencies.imports.length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto border border-slate-900 rounded p-1">
                {dependencies.imports.map((imp) => (
                  <button
                    key={imp.id}
                    onClick={() => selectNode(imp)}
                    className="w-full text-left truncate hover:text-cyber-blue py-0.5"
                  >
                    &gt; {imp.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-slate-600">NONE</div>
            )}
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase mb-1.5">Imported By ({dependencies.importedBy.length})</div>
            {dependencies.importedBy.length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto border border-slate-900 rounded p-1">
                {dependencies.importedBy.map((imp) => (
                  <button
                    key={imp.id}
                    onClick={() => selectNode(imp)}
                    className="w-full text-left truncate hover:text-cyber-blue py-0.5"
                  >
                    &gt; {imp.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-slate-600">NONE</div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-900">
            <button
              onClick={handleTrace}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-cyber-blue/15 hover:bg-cyber-blue/25 border border-cyber-blue/30 text-white rounded text-[10px] uppercase font-bold tracking-wider transition-colors"
            >
              <Network size={12} />
              Trace path
            </button>
            <button
              onClick={handleAskAI}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-cyber-purple/15 hover:bg-cyber-purple/25 border border-cyber-purple/30 text-white rounded text-[10px] uppercase font-bold tracking-wider transition-colors"
            >
              <MessageSquare size={12} />
              Ask navigator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default FileInspector;
