import { useMemo } from 'react';
import { useExplorerStore } from '@/stores/explorer';
import { useNavigatorStore } from '@/stores/navigator';
import { 
  X, 
  Network, 
  FileCode, 
  MessageSquare, 
  Compass, 
  ExternalLink, 
  GitCommit, 
  ShieldAlert, 
  Folder,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import type { GraphNode } from '@/types/graph';

export function FileInspector() {
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const selectNode = useExplorerStore((s) => s.selectNode);
  const focusedNode = useExplorerStore((s) => s.focusedNode);
  const setFocusedNode = useExplorerStore((s) => s.setFocusedNode);
  const dependencyMode = useExplorerStore((s) => s.dependencyMode);
  const setDependencyMode = useExplorerStore((s) => s.setDependencyMode);
  
  const graph = useExplorerStore((s) => s.graph);
  const repoOwner = useExplorerStore((s) => s.repoOwner);
  const repoName = useExplorerStore((s) => s.repoName);
  const highlightEdges = useExplorerStore((s) => s.highlightEdges);
  const isolatedCluster = useExplorerStore((s) => s.isolatedCluster);
  const isolateCluster = useExplorerStore((s) => s.isolateCluster);
  const openChat = useNavigatorStore((s) => s.openChat);
  const addMessage = useNavigatorStore((s) => s.addMessage);

  // Compute imports & imported by lists
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
      content: `Explain the purpose and dependencies of the file: \`${selectedNode.id}\``,
      timestamp: Date.now(),
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const totalDependencyCount = dependencies.imports.length + dependencies.importedBy.length;
  
  // Construct GitHub link
  const defaultBranch = graph?.defaultBranch || 'main';
  const githubUrl = repoOwner && repoName 
    ? `https://github.com/${repoOwner}/${repoName}/blob/${defaultBranch}/${selectedNode.id}`
    : null;

  return (
    <div className="absolute right-0 top-16 z-20 w-80 max-h-[82vh] overflow-y-auto pointer-events-auto p-4 animate-slide-up">
      <div className="technical-panel rounded shadow-technical p-5 font-mono text-xs text-secondary bg-surface-raised/95 border border-border-hairline">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-primary/5 pb-2 mb-4">
          <div className="flex items-center gap-1.5 text-accent-secondary font-medium tracking-wider text-[10px]">
            <FileCode size={13} className="text-accent-primary" />
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
          
          {/* File Path & Folder */}
          <div>
            <div className="text-[9px] text-secondary/40 uppercase tracking-wider mb-0.5">File Name</div>
            <div className="text-primary font-bold text-sm mb-1">{selectedNode.label}</div>
            
            <div className="text-[9px] text-secondary/40 uppercase tracking-wider mb-0.5">Full Path</div>
            <div className="text-primary break-all leading-relaxed bg-void/30 border border-primary/5 p-1.5 rounded text-[10px] select-all">
              {selectedNode.id}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-void/40 border border-primary/5 rounded p-2">
              <div className="text-[8px] text-secondary/40 tracking-wider">CONSTELLATION</div>
              <div className="text-primary font-medium truncate flex items-center gap-1 mt-0.5">
                <Folder size={10} className="text-accent-secondary shrink-0" />
                <span>{selectedNode.folder === '/' ? 'root' : selectedNode.folder}</span>
              </div>
            </div>
            <div className="bg-void/40 border border-primary/5 rounded p-2">
              <div className="text-[8px] text-secondary/40 tracking-wider">LANGUAGE</div>
              <div className="text-primary font-semibold uppercase mt-0.5">{selectedNode.language || 'Unknown'}</div>
            </div>
          </div>

          {/* Size & Line Metrics */}
          <div className="grid grid-cols-2 gap-2 bg-void/50 border border-primary/5 rounded p-2.5">
            <div>
              <div className="text-[8px] text-secondary/40 tracking-wider">FILE SIZE</div>
              <div className="text-primary font-bold mt-0.5">{formatSize(selectedNode.size)}</div>
            </div>
            <div>
              <div className="text-[8px] text-secondary/40 tracking-wider">LINE COUNT</div>
              <div className="text-primary font-bold mt-0.5">{selectedNode.lineCount} lines</div>
            </div>
            <div>
              <div className="text-[8px] text-secondary/40 tracking-wider">IMPORTANCE</div>
              <div className="text-primary font-semibold mt-0.5">{(selectedNode.centrality * 100).toFixed(0)} / 100</div>
            </div>
            <div>
              <div className="text-[8px] text-secondary/40 tracking-wider">RISK LEVEL</div>
              <div className={`font-bold uppercase mt-0.5 ${selectedNode.riskLevel === 'high' ? 'text-danger' : selectedNode.riskLevel === 'medium' ? 'text-accent-primary' : 'text-accent-secondary'}`}>
                {selectedNode.riskLevel}
              </div>
            </div>
          </div>

          {/* Activity / Git Details */}
          <div className="border-t border-primary/5 pt-3">
            <div className="text-[9px] text-secondary/40 uppercase tracking-wider mb-2">GIT & ACTIVITY METRICS</div>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between items-center py-0.5 border-b border-primary/5">
                <span className="text-secondary/60">Last Modified</span>
                <span className="text-primary font-medium">{selectedNode.lastModified || 'Unavailable'}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-primary/5">
                <span className="text-secondary/60">Change Frequency</span>
                <span className="text-primary font-medium">{selectedNode.commits > 0 ? `${selectedNode.commits} commits` : (selectedNode.isRecent ? 'High' : 'Low')}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-secondary/60">Recent Commits</span>
                <span className="text-secondary/40 italic flex items-center gap-1">
                  <GitCommit size={10} />
                  <span>Unavailable</span>
                </span>
              </div>
            </div>
          </div>

          {/* Risk Indicators */}
          {selectedNode.riskLevel !== 'low' && (
            <div className="bg-danger/5 border border-danger/20 rounded p-2.5 flex items-start gap-2 text-[10px]">
              <ShieldAlert size={12} className="text-danger shrink-0 mt-0.5" />
              <div>
                <div className="text-danger font-semibold uppercase tracking-wider">STRUCTURAL RISK WARNING</div>
                <div className="text-secondary/90 leading-normal mt-0.5">
                  {selectedNode.riskLevel === 'high' 
                    ? 'High central weight with extensive dependencies. Modifying this constellation star could introduce transitive regressions.' 
                    : 'Moderate dependency density. Take care when updating imports.'}
                </div>
              </div>
            </div>
          )}

          {/* Dependency Visualization Modes */}
          <div className="border-t border-primary/5 pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] text-secondary/40 uppercase tracking-wider">DEPENDENCY MODE</span>
              <span className="text-[9px] text-accent-secondary font-medium uppercase">{dependencyMode}</span>
            </div>
            
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-void border border-primary/5 rounded">
              {(['all', 'outgoing', 'incoming', 'impact'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDependencyMode(mode)}
                  className={`py-1 text-[8px] font-bold rounded uppercase transition-all ${
                    dependencyMode === mode
                      ? 'bg-accent-primary/15 text-primary border border-accent-primary/25'
                      : 'text-secondary/50 hover:text-secondary border border-transparent'
                  }`}
                >
                  {mode === 'all' ? 'All' : mode === 'outgoing' ? 'Out' : mode === 'incoming' ? 'In' : 'Impact'}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Imports list */}
          <div>
            <div className="text-[9px] text-secondary/40 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Direct Imports</span>
              <span className="text-primary font-bold">{dependencies.imports.length}</span>
            </div>
            {dependencies.imports.length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto border border-primary/5 rounded p-1.5 bg-void/30">
                {dependencies.imports.map((imp) => (
                  <button
                    key={imp.id}
                    onClick={() => selectNode(imp)}
                    className="w-full text-left truncate py-0.5 hover:text-accent-selected text-secondary/80 transition-colors block text-[9px]"
                  >
                    &gt; {imp.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[9px] text-secondary/30 italic">No Outgoing Dependencies</div>
            )}
          </div>

          {/* Imported By list */}
          <div>
            <div className="text-[9px] text-secondary/40 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Imported By (Reverse)</span>
              <span className="text-primary font-bold">{dependencies.importedBy.length}</span>
            </div>
            {dependencies.importedBy.length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto border border-primary/5 rounded p-1.5 bg-void/30">
                {dependencies.importedBy.map((imp) => (
                  <button
                    key={imp.id}
                    onClick={() => selectNode(imp)}
                    className="w-full text-left truncate py-0.5 hover:text-accent-selected text-secondary/80 transition-colors block text-[9px]"
                  >
                    &gt; {imp.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[9px] text-secondary/30 italic">No Incoming Dependencies</div>
            )}
          </div>

          {/* Explanation placeholder */}
          <div className="border-t border-primary/5 pt-3">
            <div className="text-[9px] text-secondary/40 uppercase tracking-wider mb-1">AI EXPLANATION</div>
            <div className="text-secondary/40 italic leading-normal text-[10px] bg-void/30 border border-primary/5 p-2 rounded">
              Explanation unavailable. Prompt AI Navigator below to summarize structure and parse file dependencies.
            </div>
          </div>

          {/* Action Row */}
          <div className="space-y-2 pt-3 border-t border-primary/5">
            <div className="flex gap-2">
              <button
                onClick={() => setFocusedNode(focusedNode?.id === selectedNode.id ? null : selectedNode)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 border rounded text-[9px] font-medium tracking-wider uppercase transition-colors ${
                  focusedNode?.id === selectedNode.id
                    ? 'bg-accent-secondary/20 border-accent-secondary/50 text-primary'
                    : 'bg-accent-primary/10 hover:bg-accent-primary/20 border-accent-primary/35 text-primary'
                }`}
              >
                <Compass size={11} className="text-accent-primary" />
                {focusedNode?.id === selectedNode.id ? 'Unfocus' : 'Focus Star'}
              </button>

              <button
                onClick={handleTrace}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-surface-secondary hover:bg-surface-secondary/80 border border-primary/10 hover:border-primary/20 text-primary rounded text-[9px] font-medium tracking-wider uppercase transition-colors"
              >
                <ArrowRightLeft size={11} className="text-accent-secondary" />
                Trace Path
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => isolateCluster(isolatedCluster === selectedNode.folder ? null : selectedNode.folder)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 border rounded text-[9px] font-medium tracking-wider uppercase transition-colors ${
                  isolatedCluster === selectedNode.folder
                    ? 'bg-accent-selected/10 border-accent-selected/40 text-primary'
                    : 'bg-surface-secondary hover:bg-surface-secondary/80 border border-primary/10 text-primary'
                }`}
              >
                <Layers size={11} className="text-accent-selected" />
                {isolatedCluster === selectedNode.folder ? 'De-Isolate' : 'Isolate System'}
              </button>

              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-surface-secondary hover:bg-surface-secondary/80 border border-primary/10 hover:border-primary/20 text-primary rounded text-[9px] font-medium tracking-wider uppercase transition-colors text-center decoration-none pointer-events-auto"
                >
                  <ExternalLink size={11} />
                  GitHub URL
                </a>
              )}
            </div>

            <button
              onClick={handleAskAI}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-accent-secondary/10 hover:bg-accent-secondary/20 border border-accent-secondary/30 text-primary rounded text-[9px] font-medium tracking-wider uppercase transition-colors"
            >
              <MessageSquare size={11} />
              Ask AI Navigator
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default FileInspector;
