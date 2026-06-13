import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

export function Legend() {
  const [isOpen, setIsOpen] = useState(false);

  const encodings = [
    { label: 'entry point', color: 'bg-white border-white/50' },
    { label: 'component', color: 'bg-[#00d4ff] border-cyan-400/50' },
    { label: 'utility / logic', color: 'bg-[#7c3aed] border-purple-500/50' },
    { label: 'state store', color: 'bg-[#ff6b35] border-amber-500/50' },
    { label: 'layout / style', color: 'bg-[#ec4899] border-pink-500/50' },
    { label: 'config file', color: 'bg-[#94a3b8] border-slate-400/50' },
    { label: 'test file', color: 'bg-[#22c55e] border-green-500/50' },
    { label: 'critical issue', color: 'bg-[#ff2d55] border-red-500/50 animate-pulse' },
  ];

  if (!isOpen) {
    return (
      <div className="absolute left-4 bottom-24 z-20 pointer-events-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-black/40 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded font-mono text-[10px] uppercase tracking-wider transition-all"
        >
          <HelpCircle size={12} />
          <span>System Legend</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute left-4 bottom-24 z-20 pointer-events-auto w-56 animate-slide-up">
      <div className="glass-panel border-slate-800/80 rounded-lg p-4 font-mono text-xs text-slate-300">
        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-3">
          <span className="font-bold uppercase tracking-wider text-cyber-blue flex items-center gap-1">
            <HelpCircle size={12} /> Legend
          </span>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="space-y-2">
          {encodings.map((enc, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full border ${enc.color}`} />
              <span className="text-[10px] uppercase tracking-wider text-slate-400">{enc.label}</span>
            </div>
          ))}
          <div className="border-t border-slate-900 pt-2 text-[9px] text-slate-500 leading-relaxed uppercase">
            Double-Click stars to examine. Left-Click/Drag or WASD to navigate. Scroll to zoom.
          </div>
        </div>
      </div>
    </div>
  );
}
export default Legend;
