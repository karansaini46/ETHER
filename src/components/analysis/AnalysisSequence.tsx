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
      case 'validating': return 'Validating repository specification';
      case 'reading-structure': return 'Scanning directory structure';
      case 'mapping-languages': return 'Classifying file languages';
      case 'detecting-dependencies': return 'Analyzing import dependencies';
      case 'measuring-activity': return 'Parsing commit history';
      case 'constructing-constellations': return 'Grouping folder clusters';
      case 'calculating-layout': return 'Calculating coordinates';
      case 'ready': return 'Rendering visual graph';
      case 'error': return 'Analysis failed';
      default: return 'Connecting';
    }
  };

  return (
    <div className="w-full max-w-lg technical-panel p-8 md:p-10 shadow-technical font-mono relative overflow-hidden rounded bg-surface-raised/90">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent-primary to-transparent" />

      <div className="space-y-6">
        <div className="flex justify-between items-center text-[10px] text-accent-secondary font-medium tracking-wider">
          <span>REPOSITORY ANALYSIS SYSTEM</span>
          <span>{progress}%</span>
        </div>

        {/* Progress Bar Container */}
        <div className="h-1.5 w-full bg-[#181817] border border-primary/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Console Log Area */}
        <div className="bg-void border border-primary/5 rounded p-4 h-36 overflow-y-auto text-[10px] leading-relaxed text-secondary flex flex-col justify-end">
          <div className="space-y-1.5">
            <div className="text-secondary/40">&gt; ETHER ANALYSIS LOGGER CLIENT v1.0.0</div>
            <div className="text-secondary/40">&gt; ESTABLISHING STREAM TUNNEL...</div>
            <div className="text-accent-selected">&gt; STAGE: {getStageLabel(stage)}</div>
            {message && <div className="text-primary/80">&gt; LOG: {message}</div>}
            {error && (
              <div className="text-danger font-semibold animate-pulse">
                &gt; ERROR: {error}
              </div>
            )}
          </div>
        </div>

        {/* Error handling recovery actions */}
        {stage === 'error' ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-danger/10 hover:bg-danger/20 border border-danger/35 text-primary text-xs font-medium tracking-wider rounded uppercase transition-colors"
            >
              Back to repository input
            </button>
          </div>
        ) : (
          <button
            onClick={handleCancel}
            className="w-full py-2 bg-surface-secondary hover:bg-surface-secondary/80 border border-primary/5 text-secondary hover:text-primary text-[10px] font-medium tracking-wider rounded uppercase transition-colors"
          >
            ABORT ANALYSIS
          </button>
        )}
      </div>
    </div>
  );
}
export default AnalysisSequence;

