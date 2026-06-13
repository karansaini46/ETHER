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
        <button onClick={handleBack} className="hover:opacity-85 transition-opacity">
          <Logo size="sm" />
        </button>

        {graph && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-surface-raised/80 border border-primary/10 rounded font-mono text-xs text-secondary">
            <span className="text-accent-secondary">{graph.repoOwner}</span>
            <span className="text-secondary/40">/</span>
            <span className="text-primary font-medium">{graph.repoName}</span>
            {isDemo && (
              <span className="ml-2 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary px-1.5 py-0.5 rounded text-[9px] font-medium tracking-wider">
                DEMO
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-surface-raised/80 hover:bg-surface-secondary border border-primary/10 hover:border-accent-selected/50 text-secondary hover:text-primary rounded font-mono text-xs tracking-wider transition-all"
        >
          <Search size={13} className="text-accent-secondary" />
          <span className="hidden sm:inline">Search Files</span>
          <kbd className="hidden lg:inline bg-void px-1.5 py-0.5 rounded border border-primary/5 text-[9px] text-secondary/70">
            ⌘K
          </kbd>
        </button>
      </div>
    </div>
  );
}
export default TopBar;

