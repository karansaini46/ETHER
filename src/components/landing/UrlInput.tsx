import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useExplorerStore } from '@/stores/explorer';

export function UrlInput() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setRepoUrl = useExplorerStore((s) => s.setRepoUrl);

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.startAnalysis(trimmedUrl);
      setRepoUrl(trimmedUrl);
      navigate(`/analysis/${result.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect to ETHER server. Check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={validateAndSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow flex items-center">
          {/* GitHub Icon prefix */}
          <div className="absolute left-4 text-secondary pointer-events-none">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
              <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="github.com/owner/repository"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="w-full pl-11 pr-4 py-3 bg-[#131312] border border-primary/10 focus:border-accent-selected/50 focus:ring-1 focus:ring-accent-selected/20 text-primary rounded font-mono text-xs shadow-inner transition-colors disabled:opacity-50"
            aria-label="GitHub Repository URL"
          />
          {isLoading && (
            <div className="absolute right-3 w-4 h-4 border border-accent-selected border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="py-3 px-6 bg-accent-primary hover:bg-[#b0582c] disabled:bg-accent-primary/40 text-primary text-xs font-medium tracking-wider rounded transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {isLoading ? 'ANALYZING...' : 'Explore repository'}
        </button>
      </form>

      {error && (
        <div className="text-[10px] text-danger font-mono mt-2 pl-1 uppercase tracking-wide">
          &gt; error: {error}
        </div>
      )}
    </div>
  );
}
export default UrlInput;

