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
      // Call API to start analysis
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
    <div className="w-full max-w-lg mx-auto">
      <form onSubmit={validateAndSubmit} className="flex flex-col gap-3">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-black/40 border border-slate-700/80 focus:border-cyber-blue text-white rounded-lg font-mono text-sm shadow-inner transition-colors disabled:opacity-50"
            aria-label="GitHub Repository URL"
          />
          {isLoading && (
            <div className="absolute right-3 w-5 h-5 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {error && (
          <div className="text-xs text-cyber-red font-mono px-1">
            &gt; ERROR: {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-cyber-blue/20 hover:bg-cyber-blue/35 border border-cyber-blue text-white text-sm font-semibold tracking-wider rounded-lg uppercase transition-colors disabled:opacity-50"
        >
          {isLoading ? 'ANALYZING...' : 'INITIALIZE UNIVERSE'}
        </button>
      </form>
    </div>
  );
}
export default UrlInput;
