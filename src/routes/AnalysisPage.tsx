import { useParams } from 'react-router-dom';
import { useAnalysis } from '@/features/repository/useAnalysis';
import { AnalysisSequence } from '@/components/analysis/AnalysisSequence';
import { Logo } from '@/components/brand/Logo';

export function AnalysisPage() {
  const { analysisId } = useParams<{ analysisId: string }>();

  // Run the analysis stream hook
  useAnalysis(analysisId);

  if (!analysisId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center font-mono text-xs text-danger bg-void">
        ERROR: Missing analysis token specification
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void flex flex-col justify-center items-center px-6 py-12 select-none relative overflow-hidden">
      {/* Background visual detail */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mb-10 z-10">
        <Logo size="md" />
      </div>

      <div className="z-10 w-full flex justify-center">
        <AnalysisSequence analysisId={analysisId} />
      </div>
    </div>
  );
}
export default AnalysisPage;
