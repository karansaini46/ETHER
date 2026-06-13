import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

export function Legend() {
  const [isOpen, setIsOpen] = useState(false);

  const encodings = [
    { label: 'entry point', color: 'bg-[#ECE9E1] border-[#ECE9E1]/50' },
    { label: 'component', color: 'bg-[#A8AF86] border-[#A8AF86]/50' },
    { label: 'utility / logic', color: 'bg-[#ECE9E1] border-[#ECE9E1]/50' },
    { label: 'state store', color: 'bg-[#E3C78A] border-[#E3C78A]/50' },
    { label: 'layout / style', color: 'bg-[#97958E] border-[#97958E]/50' },
    { label: 'config file', color: 'bg-[#6E6B64] border-[#6E6B64]/50' },
    { label: 'test file', color: 'bg-[#A8AF86] border-[#A8AF86]/50' },
    { label: 'critical issue', color: 'bg-[#C6504B] border-[#C6504B]/50 animate-pulse' },
  ];

  if (!isOpen) {
    return (
      <div className="absolute left-4 bottom-24 z-20 pointer-events-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-surface-raised/80 hover:bg-surface-secondary border border-primary/10 text-secondary hover:text-primary rounded font-mono text-[9px] uppercase tracking-wider transition-all"
        >
          <HelpCircle size={11} />
          <span>System Legend</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute left-4 bottom-24 z-20 pointer-events-auto w-56 animate-slide-up">
      <div className="technical-panel rounded shadow-technical p-4 font-mono text-xs text-secondary bg-surface-raised/95">
        <div className="flex justify-between items-center border-b border-primary/5 pb-1.5 mb-3">
          <span className="font-semibold uppercase tracking-wider text-accent-secondary flex items-center gap-1 text-[10px]">
            <HelpCircle size={11} /> Legend
          </span>
          <button onClick={() => setIsOpen(false)} className="text-secondary/60 hover:text-primary">
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="space-y-2">
          {encodings.map((enc, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full border ${enc.color}`} />
              <span className="text-[9px] uppercase tracking-wider text-secondary/70">{enc.label}</span>
            </div>
          ))}
          <div className="border-t border-primary/5 pt-2 text-[9px] text-secondary/40 leading-relaxed uppercase">
            Click stars to examine. Drag or WASD to navigate. Scroll to zoom.
          </div>
        </div>
      </div>
    </div>
  );
}
export default Legend;

