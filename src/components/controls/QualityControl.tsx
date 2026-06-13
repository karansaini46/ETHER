import { usePreferencesStore } from '@/stores/preferences';
import { Sliders, Eye, EyeOff } from 'lucide-react';
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

  const presets: QualityPreset[] = ['low', 'balanced', 'high', 'auto'];

  return (
    <div className="absolute right-4 bottom-24 z-20 pointer-events-auto p-2">
      <div className="glass-panel border-slate-800/80 rounded-lg p-4 font-mono text-xs text-slate-300 w-56">
        <div className="flex items-center gap-1.5 text-cyber-blue font-bold tracking-wider border-b border-slate-800/80 pb-1.5 mb-3">
          <Sliders size={12} />
          <span>VISUAL RENDERING</span>
        </div>

        <div className="space-y-3">
          {/* Presets */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase mb-1.5">Preset Profile</div>
            <div className="grid grid-cols-2 gap-1">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setQuality(p)}
                  className={`py-1 rounded text-center text-[10px] uppercase font-bold border transition-all ${quality === p ? 'bg-cyber-blue/20 border-cyber-blue text-white' : 'bg-black/30 border-slate-800 hover:border-slate-700 text-slate-400'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-1.5 border-t border-slate-900 pt-2.5">
            <button
              onClick={toggleLabels}
              className="w-full flex items-center justify-between py-1 text-left hover:text-white transition-colors"
            >
              <span>Node Labels</span>
              {showLabels ? <Eye size={12} className="text-cyber-blue" /> : <EyeOff size={12} className="text-slate-600" />}
            </button>

            <button
              onClick={toggleLines}
              className="w-full flex items-center justify-between py-1 text-left hover:text-white transition-colors"
            >
              <span>Dependency Lines</span>
              {showLines ? <Eye size={12} className="text-cyber-blue" /> : <EyeOff size={12} className="text-slate-600" />}
            </button>

            <button
              onClick={toggleActivity}
              className="w-full flex items-center justify-between py-1 text-left hover:text-white transition-colors"
            >
              <span>Activity Particles</span>
              {showActivity ? <Eye size={12} className="text-cyber-blue" /> : <EyeOff size={12} className="text-slate-600" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default QualityControl;
