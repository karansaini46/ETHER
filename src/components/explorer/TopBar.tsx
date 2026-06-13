import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { useExplorerStore } from '@/stores/explorer';
import { Search } from 'lucide-react';

export function TopBar() {
  const graph = useExplorerStore((s) => s.graph);
  const isDemo = useExplorerStore((s) => s.isDemo);
  const setSearchOpen = useExplorerStore((s) => s.setSearchOpen);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="absolute top-0 left-0 w-full z-20 px-6 py-4 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-6 pointer-events-auto">
        <button onClick={handleBack} className="hover:opacity-80 transition-opacity">
          <Logo size="sm" />
        </button>

        {graph && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-black/40 border border-slate-800 rounded font-mono text-xs text-slate-300">
            <span className="text-cyber-blue">{graph.repoOwner}</span>
            <span className="text-slate-600">/</span>
            <span className="text-white font-semibold">{graph.repoName}</span>
            {isDemo && (
              <span className="ml-2 bg-cyber-purple/20 border border-cyber-purple/40 text-cyber-purple px-1.5 py-0.5 rounded text-[10px] font-bold">
                DEMO
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-slate-900 border border-slate-800 hover:border-cyber-blue text-slate-400 hover:text-white rounded font-mono text-xs uppercase tracking-wider transition-all"
        >
          <Search size={14} className="text-cyber-blue" />
          <span className="hidden sm:inline">Search Files</span>
          <kbd className="hidden lg:inline bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]">
            ⌘K
          </kbd>
        </button>
      </div>
    </div>
  );
}
export default TopBar;
