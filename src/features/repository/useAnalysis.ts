import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useExplorerStore } from '@/stores/explorer';

export function useAnalysis(analysisId: string | undefined) {
  const navigate = useNavigate();
  const setAnalysisStatus = useExplorerStore((s) => s.setAnalysisStatus);
  const setGraph = useExplorerStore((s) => s.setGraph);

  useEffect(() => {
    if (!analysisId) return;

    // Reset status
    setAnalysisStatus('validating', 0, 'Connecting to ETHER server...');

    const unsubscribe = api.subscribeToAnalysis(
      analysisId,
      async (status) => {
        setAnalysisStatus(status.stage, status.progress, status.message, status.error);

        if (status.stage === 'ready') {
          try {
            // Fetch graph
            const graph = await api.getGraph(analysisId);
            setGraph(graph, false);
            // Warp to explorer page
            navigate(`/explore/${analysisId}`);
          } catch (err: any) {
            setAnalysisStatus('error', 0, 'Failed to fetch graph', err.message);
          }
        }
      },
      (error) => {
        setAnalysisStatus('error', 0, 'Lost connection to analysis stream', error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [analysisId, setAnalysisStatus, setGraph, navigate]);
}
