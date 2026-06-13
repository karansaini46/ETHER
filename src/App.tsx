import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { WebGLFallback } from '@/components/feedback/WebGLFallback';

// Lazy-loaded routes
const LandingPage = lazy(() => import('@/routes/LandingPage'));
const AnalysisPage = lazy(() => import('@/routes/AnalysisPage'));
const ExplorerPage = lazy(() => import('@/routes/ExplorerPage'));
const DemoPage = lazy(() => import('@/routes/DemoPage'));
const SecurityPage = lazy(() => import('@/routes/SecurityPage'));
const PrivacyPage = lazy(() => import('@/routes/PrivacyPage'));
const NotFoundPage = lazy(() => import('@/routes/NotFoundPage'));

function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-void font-mono text-cyan-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-4" />
      <div>LOADING CYBERSPACE...</div>
    </div>
  );
}

export default function App() {
  const isWebGLSupported = useWebGLSupport();

  if (!isWebGLSupported) {
    return <WebGLFallback />;
  }

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-void text-slate-200 select-none">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/analysis/:analysisId" element={<AnalysisPage />} />
            <Route path="/explore/demo" element={<DemoPage />} />
            <Route path="/explore/:analysisId" element={<ExplorerPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
