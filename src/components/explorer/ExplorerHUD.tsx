import { useState, useEffect } from 'react';
import { useExplorerStore } from '@/stores/explorer';
import { TopBar } from './TopBar';
import { FileInspector } from '../inspector/FileInspector';
import { ConstellationNav } from './ConstellationNav';
import { NavigatorPanel } from '../navigator/NavigatorPanel';
import { QualityControl } from '../controls/QualityControl';
import { SearchCommand } from './SearchCommand';
import { 
  Layers, 
  FileCode, 
  Sliders, 
  Search,
  X 
} from 'lucide-react';

export function ExplorerHUD() {
  const selectedNode = useExplorerStore((s) => s.selectedNode);
  const inspectorOpen = useExplorerStore((s) => s.inspectorOpen);
  const setInspectorOpen = useExplorerStore((s) => s.setInspectorOpen);
  const renderingOpen = useExplorerStore((s) => s.renderingOpen);
  const setRenderingOpen = useExplorerStore((s) => s.setRenderingOpen);
  const clustersOpen = useExplorerStore((s) => s.clustersOpen);
  const setClustersOpen = useExplorerStore((s) => s.setClustersOpen);
  const setSearchOpen = useExplorerStore((s) => s.setSearchOpen);

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Monitor window size and trigger reactive flags
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1200);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasSelectedNode = !!selectedNode;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-hud-rails flex flex-col justify-between">
      
      {/* Top dashboard header bar */}
      <TopBar />

      {/* Main Viewport Rails container */}
      <div className="relative flex-1 w-full h-[calc(100dvh-5rem)] flex justify-between px-6 pb-6 mt-20 overflow-hidden select-none">
        
        {/* ================= LEFT RAIL ================= */}
        {!isMobile && clustersOpen && (
          <div className="w-64 max-h-[calc(100dvh-6rem)] pointer-events-auto flex flex-col z-panels select-none">
            <ConstellationNav />
          </div>
        )}

        {/* ================= CENTER / BOTTOM ================= */}
        <div className="flex-1 flex flex-col justify-end items-center px-4 pb-2 pointer-events-none z-panels">
          <div className="w-full max-w-xl flex flex-col items-center gap-3">
            <NavigatorPanel />

            {/* Mobile / Tablet floating tab switches */}
            {(isMobile || isTablet) && (
              <div className="pointer-events-auto flex items-center gap-2 p-1.5 bg-surface-raised/95 border border-border-hairline rounded shadow-technical">
                <button
                  onClick={() => setClustersOpen(!clustersOpen)}
                  aria-label="Toggle System Clusters panel"
                  className={`px-3 py-1.5 rounded text-[9px] uppercase font-bold font-mono tracking-wider flex items-center gap-1.5 transition-all border ${
                    clustersOpen 
                      ? 'bg-accent-primary/15 border-accent-primary/30 text-primary' 
                      : 'bg-transparent border-transparent text-secondary hover:text-primary'
                  }`}
                >
                  <Layers size={11} className={clustersOpen ? 'text-accent-primary' : 'text-secondary/40'} />
                  <span>Systems</span>
                </button>

                {hasSelectedNode && (
                  <button
                    onClick={() => setInspectorOpen(!inspectorOpen)}
                    aria-label="Toggle File Inspector panel"
                    className={`px-3 py-1.5 rounded text-[9px] uppercase font-bold font-mono tracking-wider flex items-center gap-1.5 transition-all border ${
                      inspectorOpen 
                        ? 'bg-accent-primary/15 border-accent-primary/30 text-primary' 
                        : 'bg-transparent border-transparent text-secondary hover:text-primary'
                    }`}
                  >
                    <FileCode size={11} className={inspectorOpen ? 'text-accent-primary' : 'text-secondary/40'} />
                    <span>Inspector</span>
                  </button>
                )}

                <button
                  onClick={() => setRenderingOpen(!renderingOpen)}
                  aria-label="Toggle Quality Controls panel"
                  className={`px-3 py-1.5 rounded text-[9px] uppercase font-bold font-mono tracking-wider flex items-center gap-1.5 transition-all border ${
                    renderingOpen 
                      ? 'bg-accent-primary/15 border-accent-primary/30 text-primary' 
                      : 'bg-transparent border-transparent text-secondary hover:text-primary'
                  }`}
                >
                  <Sliders size={11} className={renderingOpen ? 'text-accent-primary' : 'text-secondary/40'} />
                  <span>Controls</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT RAIL ================= */}
        {!isMobile && (
          <div className="w-80 max-h-[calc(100dvh-6rem)] pointer-events-auto flex flex-col gap-4 z-panels overflow-y-auto hud-scrollbar pr-1 select-none">
            {/* Desktop Upper Right Search trigger */}
            {!isTablet && (
              <div className="technical-panel rounded shadow-technical p-4 font-mono text-[10px] text-secondary bg-surface-raised/95 border border-border-hairline">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-full flex items-center justify-between p-2 bg-void hover:bg-surface-secondary border border-primary/10 rounded text-left transition-colors"
                >
                  <span className="flex items-center gap-2 text-secondary/60">
                    <Search size={12} />
                    <span>Search constellation files...</span>
                  </span>
                  <span className="bg-surface-secondary px-1.5 py-0.5 rounded text-[8px] border border-primary/5 text-secondary/40">
                    /
                  </span>
                </button>
              </div>
            )}

            {/* File Inspector details */}
            {inspectorOpen && hasSelectedNode && <FileInspector />}

            {/* Visual Rendering options */}
            {renderingOpen && <QualityControl />}
          </div>
        )}

      </div>

      {/* ================= MOBILE BOTTOM DRAWERS ================= */}
      {isMobile && (
        <>
          {/* System Clusters Drawer */}
          {clustersOpen && (
            <div className="fixed inset-x-0 bottom-0 max-h-[60dvh] bg-surface-raised/95 border-t border-border-hairline rounded-t-lg z-bottom-sheets p-4 overflow-y-auto pointer-events-auto select-none shadow-2xl flex flex-col">
              <div className="flex justify-between items-center border-b border-primary/5 pb-2 mb-3 shrink-0">
                <span className="font-mono font-semibold text-accent-secondary text-[10px] uppercase tracking-wider">SYSTEMS DRAWER</span>
                <button 
                  onClick={() => setClustersOpen(false)} 
                  className="text-secondary/60 hover:text-primary"
                  aria-label="Close Systems drawer"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto hud-scrollbar">
                <ConstellationNav />
              </div>
            </div>
          )}

          {/* File Inspector Drawer */}
          {inspectorOpen && hasSelectedNode && (
            <div className="fixed inset-x-0 bottom-0 max-h-[60dvh] bg-surface-raised/95 border-t border-border-hairline rounded-t-lg z-bottom-sheets p-4 overflow-y-auto pointer-events-auto select-none shadow-2xl flex flex-col">
              <div className="flex justify-between items-center border-b border-primary/5 pb-2 mb-3 shrink-0">
                <span className="font-mono font-semibold text-accent-secondary text-[10px] uppercase tracking-wider">INSPECTOR DRAWER</span>
                <button 
                  onClick={() => setInspectorOpen(false)} 
                  className="text-secondary/60 hover:text-primary"
                  aria-label="Close Inspector drawer"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto hud-scrollbar">
                <FileInspector />
              </div>
            </div>
          )}

          {/* Visual Controls Drawer */}
          {renderingOpen && (
            <div className="fixed inset-x-0 bottom-0 max-h-[60dvh] bg-surface-raised/95 border-t border-border-hairline rounded-t-lg z-bottom-sheets p-4 overflow-y-auto pointer-events-auto select-none shadow-2xl flex flex-col">
              <div className="flex justify-between items-center border-b border-primary/5 pb-2 mb-3 shrink-0">
                <span className="font-mono font-semibold text-accent-secondary text-[10px] uppercase tracking-wider">CONTROLS DRAWER</span>
                <button 
                  onClick={() => setRenderingOpen(false)} 
                  className="text-secondary/60 hover:text-primary"
                  aria-label="Close Controls drawer"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto hud-scrollbar">
                <QualityControl />
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating search palette */}
      <SearchCommand />
    </div>
  );
}

export default ExplorerHUD;
