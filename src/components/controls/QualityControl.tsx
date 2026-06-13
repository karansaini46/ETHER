import { usePreferencesStore } from '@/stores/preferences';
import { useExplorerStore } from '@/stores/explorer';
import { Sliders, Eye, EyeOff, X } from 'lucide-react';
import type { QualityPreset } from '@/types/api';

export function QualityControl() {
  const quality = usePreferencesStore((s) => s.quality);
  const setQuality = usePreferencesStore((s) => s.setQuality);

  const showLabels = usePreferencesStore((s) => s.showLabels);
  const toggleLabels = usePreferencesStore((s) => s.toggleLabels);

  const showLines = usePreferencesStore((s) => s.showDependencyLines);
  const toggleLines = usePreferencesStore((s) => s.toggleDependencyLines);

  const showActivity = usePreferencesStore((s) => s.showActivityEffects);
  const toggleActivity = usePreferencesStore((s) => s.toggleActivityEffects);

  const renderingOpen = useExplorerStore((s) => s.renderingOpen);
  const setRenderingOpen = useExplorerStore((s) => s.setRenderingOpen);

  const presets: QualityPreset[] = ['low', 'balanced', 'high', 'auto'];

  if (!renderingOpen) return null;

  return (
    <div className="technical-panel rounded shadow-technical p-4 font-mono text-xs text-secondary bg-surface-raised/95 border border-border-hairline select-none">
      <div className="flex justify-between items-center border-b border-primary/5 pb-1.5 mb-3 text-[10px]">
        <div className="flex items-center gap-1.5 text-accent-secondary font-medium tracking-wider">
          <Sliders size={11} className="text-accent-primary" />
          <span>VISUAL RENDERING</span>
        </div>
        <button
          onClick={() => setRenderingOpen(false)}
          className="text-secondary/60 hover:text-primary transition-colors"
          aria-label="Hide quality control panel"
        >
          <X size={13} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Presets */}
        <div>
          <div className="text-[9px] text-secondary/50 uppercase tracking-wider mb-1.5">Preset Profile</div>
          <div className="grid grid-cols-2 gap-1">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setQuality(p)}
                className={`py-1 rounded text-center text-[10px] uppercase font-bold border transition-all ${quality === p ? 'bg-accent-primary/10 border-accent-primary/45 text-primary' : 'bg-void border border-primary/10 hover:border-primary/20 text-secondary'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="space-y-1.5 border-t border-primary/5 pt-2.5">
          <button
            onClick={toggleLabels}
            className="w-full flex items-center justify-between py-1 text-left hover:text-primary transition-colors"
          >
            <span>Node Labels</span>
            {showLabels ? <Eye size={12} className="text-accent-primary" /> : <EyeOff size={12} className="text-secondary/40" />}
          </button>

          <button
            onClick={toggleLines}
            className="w-full flex items-center justify-between py-1 text-left hover:text-primary transition-colors"
          >
            <span>Dependency Lines</span>
            {showLines ? <Eye size={12} className="text-accent-primary" /> : <EyeOff size={12} className="text-secondary/40" />}
          </button>

          <button
            onClick={toggleActivity}
            className="w-full flex items-center justify-between py-1 text-left hover:text-primary transition-colors"
          >
            <span>Activity Particles</span>
            {showActivity ? <Eye size={12} className="text-accent-primary" /> : <EyeOff size={12} className="text-secondary/40" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QualityControl;
