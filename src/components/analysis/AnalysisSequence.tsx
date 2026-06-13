import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useExplorerStore } from '@/stores/explorer';

interface AnalysisSequenceProps {
  analysisId: string;
}

export function AnalysisSequence({ analysisId }: AnalysisSequenceProps) {
  const navigate = useNavigate();
  const stage = useExplorerStore((s) => s.analysisStage);
  const progress = useExplorerStore((s) => s.analysisProgress);
  const message = useExplorerStore((s) => s.analysisMessage);
  const error = useExplorerStore((s) => s.analysisError);

  const handleCancel = async () => {
    try {
      await api.cancelAnalysis(analysisId);
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  const getStageLabel = (currentStage: string) => {
    switch (currentStage) {
      case 'validating': return 'VALIDATING REPOSITORY SPECIFICATION';
      case 'reading-structure': return 'SCANNING DIRECTORY STRUCTURAL SCHEMAP';
      case 'mapping-languages': return 'MAPPING PROGRAMMING DIALECTS';
      case 'detecting-dependencies': return 'EXTRACTING TREE GRAPH MODULE DEPENDENCIES';
      case 'measuring-activity': return 'READING GIT ACTIVITY ORBITS';
      case 'constructing-constellations': return 'RESOLVING STELLAR ORBS & CONSTELLATIONS';
      case 'calculating-layout': return 'PRODUCING 3D COGNITIVE COORDINATES';
      case 'ready': return 'COMPILING SYSTEM DEPLOYMENT';
      case 'error': return 'INITIALIZATION FAULT DETECTED';
      default: return 'CONNECTING';
    }
  };

  return (
    <div className="w-full max-w-lg glass-panel p-8 md:p-10 border-cyber-blue/20 shadow-neon-blue font-mono relative overflow-hidden">
      {/* Laser line effect */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyber-blue to-transparent animate-pulse" />

      <div className="space-y-6">
        <div className="flex justify-between items-center text-xs text-cyber-blue/80 font-bold tracking-widest">
          <span>COGNITIVE MATRIX COMPILING</span>
          <span>{progress}%</span>
        </div>

        {/* Progress Bar Container */}
        <div className="h-2 w-full bg-black/40 border border-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyber-purple via-cyber-blue to-cyan-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Console Log Area */}
        <div className="bg-black/50 border border-slate-900 rounded p-4 h-36 overflow-y-auto text-[11px] leading-relaxed text-slate-400 flex flex-col justify-end">
          <div className="space-y-1.5">
            <div className="text-slate-600">&gt; ETHER CLIENT VER 1.0</div>
            <div className="text-slate-600">&gt; ESTABLISHING MATRIX TUNNEL...</div>
            <div className="text-cyber-blue">&gt; CURRENT_STAGE: {getStageLabel(stage)}</div>
            {message && <div className="text-slate-200 animate-pulse">&gt; LOG: {message}</div>}
            {error && (
              <div className="text-cyber-red font-bold animate-pulse">
                &gt; FATAL_FAULT: {error}
              </div>
            )}
          </div>
        </div>

        {/* Error handling recovery actions */}
        {stage === 'error' ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-cyber-red/20 hover:bg-cyber-red/35 border border-cyber-red text-white text-xs font-semibold tracking-wider rounded uppercase transition-colors"
            >
              Back to safe terminal
            </button>
          </div>
        ) : (
          <button
            onClick={handleCancel}
            className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-[11px] font-semibold tracking-wider rounded uppercase transition-all"
          >
            ABORT INITIALIZATION
          </button>
        )}
      </div>
    </div>
  );
}
export default AnalysisSequence;
