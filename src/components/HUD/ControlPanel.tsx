import { useState } from 'react'
import { useSelectedNode } from '@/store'

export function ControlPanel() {
  const [isSurfing, setIsSurfing] = useState(false)
  const selectedNode = useSelectedNode()
  const hasSelectedNode = !!selectedNode

  const handleSurfToggle = () => {
    const nextState = !isSurfing
    setIsSurfing(nextState)
    window.dispatchEvent(
      new CustomEvent('toggle-surf-mode', { detail: { enabled: nextState } }),
    )
  }

  const handleSupernovaClick = () => {
    window.dispatchEvent(new CustomEvent('supernova-burst'))
  }

  const handleScanClick = () => {
    window.dispatchEvent(new CustomEvent('sonar-ping'))
  }

  return (
    <div className="glass-panel pointer-events-auto absolute left-6 top-64 rounded-xl p-4 flex flex-col gap-3 min-w-[170px]">
      <h3 className="font-label text-xs uppercase tracking-[0.2em] text-slate-500">
        Galaxy controls
      </h3>
      
      <button
        onClick={handleSurfToggle}
        className={`font-label w-full rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
          isSurfing
            ? 'border-cyan bg-cyan/20 text-cyan shadow-[0_0_12px_rgba(0,212,255,0.4)]'
            : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-500'
        }`}
      >
        <span>{isSurfing ? '🚀 Surfing...' : '🏄 Autopilot'}</span>
      </button>

      <button
        onClick={handleSupernovaClick}
        disabled={!hasSelectedNode}
        className={`font-label w-full rounded-lg border px-3 py-2 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
          hasSelectedNode
            ? 'border-pink-500/50 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20'
            : 'border-slate-800 bg-slate-950/40 text-slate-600 cursor-not-allowed'
        }`}
      >
        💥 Supernova
      </button>

      <button
        onClick={handleScanClick}
        className="font-label w-full rounded-lg border border-purple-500/50 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-3 py-2 text-xs font-semibold transition-all flex items-center justify-center gap-2"
      >
        📡 Sonar Scan
      </button>
    </div>
  )
}
