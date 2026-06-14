import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useExplorerStore } from '@/stores/explorer';

export type RepositorySubmissionState =
  | 'idle'
  | 'validating'
  | 'submitting'
  | 'processing'
  | 'success'
  | 'error';

const LoadingIcon = () => (
  <svg 
    className="animate-spin-loading h-4 w-4 text-primary flex-shrink-0" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
    style={{ transformOrigin: 'center' }}
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4" 
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
    />
  </svg>
);

function parseAndValidateGithubUrl(url: string): { owner: string; repo: string } | string {
  const trimmed = url.trim();
  if (!trimmed) {
    return 'Please enter a GitHub repository URL';
  }
  if (trimmed.length > 2048) {
    return 'URL is too long';
  }
  let cleaned = trimmed;
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    cleaned = cleaned.replace(/^https?:\/\//, '');
  }
  cleaned = cleaned.replace(/^www\./, '');
  if (!cleaned.startsWith('github.com/')) {
    return 'Only GitHub repositories are supported';
  }
  const path = cleaned.replace(/^github\.com\//, '').replace(/\/+$/, '').replace(/\.git$/, '');
  const parts = path.split('/');
  
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    return 'Invalid repository URL. Expected format: github.com/owner/repo';
  }
  if (parts.length > 2) {
    const subRoute = parts[2].toLowerCase();
    if (subRoute === 'issues') {
      return 'Issue URLs are not supported';
    }
    if (subRoute === 'pull' || subRoute === 'pulls') {
      return 'Pull-request URLs are not supported';
    }
    return 'File or subdirectory URLs are not supported';
  }
  
  const owner = parts[0];
  const repo = parts[1];
  
  if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) {
    return 'Invalid repository owner or name';
  }
  if (owner.length > 100 || repo.length > 100) {
    return 'Repository owner or name is too long';
  }
  
  return { owner, repo };
}

export function UrlInput() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<RepositorySubmissionState>('idle');
  const [sseStage, setSseStage] = useState<string>('');
  
  const navigate = useNavigate();
  const setRepoUrl = useExplorerStore((s) => s.setRepoUrl);
  const setAnalysisId = useExplorerStore((s) => s.setAnalysisId);
  const setAnalysisStatus = useExplorerStore((s) => s.setAnalysisStatus);
  const setGraph = useExplorerStore((s) => s.setGraph);
  const resetStore = useExplorerStore((s) => s.reset);

  const inputRef = useRef<HTMLInputElement>(null);
  
  // Keep active request references for cancellation
  const activeRequestRef = useRef<{
    abortController: AbortController | null;
    unsubscribeStream: (() => void) | null;
    timeoutId: ReturnType<typeof setTimeout> | null;
    analysisId: string | null;
  } | null>(null);

  const cleanupRequest = () => {
    if (activeRequestRef.current) {
      const { abortController, unsubscribeStream, timeoutId, analysisId } = activeRequestRef.current;
      if (abortController) abortController.abort();
      if (unsubscribeStream) unsubscribeStream();
      if (timeoutId) clearTimeout(timeoutId);
      if (analysisId) {
        api.cancelAnalysis(analysisId).catch(() => {});
      }
      activeRequestRef.current = null;
    }
  };

  useEffect(() => {
    // Make sure landing page has a clean idle state when loaded
    resetStore();
    return () => {
      cleanupRequest();
    };
  }, [resetStore]);

  const isLoading = state === 'validating' || state === 'submitting' || state === 'processing';

  const validateAndSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Check if already loading to prevent duplicate submissions
    if (isLoading) return;

    cleanupRequest();
    setError(null);
    setState('validating');

    const validationResult = parseAndValidateGithubUrl(url);
    if (typeof validationResult === 'string') {
      setError(validationResult);
      setState('error');
      // Return focus to input
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    const { owner, repo } = validationResult;
    const normalizedUrl = `github.com/${owner}/${repo}`;
    
    setState('submitting');
    
    const abortController = new AbortController();
    activeRequestRef.current = {
      abortController,
      unsubscribeStream: null,
      timeoutId: null,
      analysisId: null,
    };

    try {
      const result = await api.startAnalysis(normalizedUrl, abortController.signal);
      setRepoUrl(normalizedUrl);
      setAnalysisId(result.id);
      
      if (abortController.signal.aborted) return;
      
      setState('processing');
      activeRequestRef.current.analysisId = result.id;
      
      // Establish SSE Subscription
      const unsubscribeStream = api.subscribeToAnalysis(
        result.id,
        async (status) => {
          setSseStage(status.stage);
          setAnalysisStatus(status.stage, status.progress, status.message, status.error);

          if (status.stage === 'ready') {
            setState('success');
            cleanupRequest();
            try {
              const graph = await api.getGraph(result.id);
              setGraph(graph, false);
              navigate(`/explore/${result.id}`);
            } catch (err: any) {
              setState('error');
              setError(err.message || 'Failed to retrieve structural graph from server.');
            }
          } else if (status.stage === 'error') {
            setState('error');
            setError(status.error || status.message || 'Analysis failed on backend.');
            cleanupRequest();
          } else if (status.stage === 'cancelled') {
            setState('idle');
            cleanupRequest();
          }
        },
        (streamErr) => {
          setState('error');
          setError(streamErr || 'Lost connection to analysis stream.');
          cleanupRequest();
        }
      );
      
      activeRequestRef.current.unsubscribeStream = unsubscribeStream;
      
      // Set client side timeout of 120s
      const timeoutId = setTimeout(() => {
        setState('error');
        setError('Analysis timed out. Please verify connection and try again.');
        cleanupRequest();
      }, 120_000);
      
      activeRequestRef.current.timeoutId = timeoutId;

    } catch (err: any) {
      if (abortController.signal.aborted) return;
      setState('error');
      
      let message = 'Failed to connect to ETHER server. Check connection.';
      if (err.name === 'AbortError') {
        message = 'Request cancelled.';
      } else if (err.message) {
        // Exclude internal traces or raw errors, provide clean summaries
        if (err.message.includes('rate limit') || err.message.includes('429')) {
          message = 'GitHub rate limit exceeded. Please try again later.';
        } else if (err.message.includes('not found') || err.message.includes('404')) {
          message = 'Repository not found or private. Ensure URL is correct and public.';
        } else {
          message = err.message;
        }
      }
      setError(message);
      cleanupRequest();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setError(null);
    }
  };

  const handleRetry = () => {
    validateAndSubmit();
  };

  const getButtonLabel = () => {
    if (state === 'validating') return 'Validating repository…';
    if (state === 'submitting') return 'Preparing universe…';
    if (state === 'processing') {
      switch (sseStage) {
        case 'validating': return 'Validating repository…';
        case 'reading-structure': 
        case 'mapping-languages': 
          return 'Reading repository…';
        case 'detecting-dependencies': 
          return 'Mapping dependencies…';
        case 'measuring-activity': 
        case 'constructing-constellations': 
        case 'calculating-layout': 
          return 'Building universe…';
        case 'ready': 
          return 'Entering universe…';
        default: 
          return 'Preparing universe…';
      }
    }
    return 'Explore repository';
  };

  const buttonLabel = getButtonLabel();

  return (
    <div className="w-full">
      <form onSubmit={validateAndSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow flex items-center">
          <label htmlFor="repo-url-input" className="sr-only">GitHub Repository URL</label>
          <div className="absolute left-4 text-secondary pointer-events-none">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
              <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
          </div>
          <input
            ref={inputRef}
            id="repo-url-input"
            type="text"
            placeholder="github.com/owner/repository"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full pl-11 pr-4 py-3 bg-[#131312] border border-primary/10 focus:border-accent-selected/50 focus:ring-1 focus:ring-accent-selected/20 text-primary rounded font-mono text-[16px] sm:text-xs shadow-inner transition-colors disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          aria-disabled={isLoading}
          aria-label={isLoading ? `${buttonLabel} in progress` : "Explore repository"}
          className="py-3 px-6 bg-accent-primary hover:bg-[#b0582c] disabled:bg-accent-primary/40 text-primary text-xs font-medium tracking-wider rounded transition-colors disabled:opacity-50 whitespace-nowrap min-w-[200px] flex items-center justify-center"
        >
          <span className="button-content flex items-center justify-center gap-2">
            {isLoading && <LoadingIcon />}
            <span>{buttonLabel}</span>
          </span>
        </button>
      </form>

      {/* Screen reader live notification */}
      <div className="sr-only" aria-live="polite">
        {isLoading ? `Analysis state: ${buttonLabel}` : ''}
      </div>

      {/* Visually stable validation error area */}
      <div className="min-h-[20px] mt-2 pl-1 text-[10px] font-mono uppercase tracking-wide flex items-center">
        {error ? (
          <div role="alert" className="text-danger flex items-center gap-1.5">
            <span aria-hidden="true">&gt; error:</span> {error}
          </div>
        ) : (
          <span className="text-secondary/30">&gt; idle</span>
        )}
      </div>

      {/* Error recovery choices */}
      {state === 'error' && (
        <div className="mt-2 flex items-center gap-4 text-[10px] font-mono pl-1">
          <button
            type="button"
            onClick={handleRetry}
            className="text-accent-primary hover:underline uppercase tracking-wider"
          >
            Retry
          </button>
          <span className="text-secondary/20">|</span>
          <Link
            to="/explore/demo"
            className="text-accent-secondary hover:underline uppercase tracking-wider"
          >
            Open demo universe
          </Link>
        </div>
      )}
    </div>
  );
}

export default UrlInput;
