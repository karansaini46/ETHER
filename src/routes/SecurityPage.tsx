import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';

export function SecurityPage() {
  return (
    <div className="min-h-screen bg-void px-6 py-12 flex flex-col items-center overflow-y-auto">
      <header className="w-full max-w-4xl flex items-center justify-between mb-12">
        <Link to="/">
          <Logo size="sm" />
        </Link>
        <Link to="/" className="text-xs font-mono text-cyber-blue hover:underline">
          &lt; BACK_TO_DASHBOARD
        </Link>
      </header>
      <main className="w-full max-w-2xl glass-panel p-8 md:p-12 border-slate-800/80">
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-white tracking-wide mb-6">
          SECURITY PRACTICES
        </h1>
        <p className="text-sm text-slate-400 font-mono mb-8">
          LAST_UPDATED: 2026-06-13
        </p>

        <section className="space-y-8 text-sm leading-relaxed text-slate-300">
          <div>
            <h2 className="text-md font-semibold text-cyber-blue uppercase tracking-wider mb-2">
              1. Local-First Design
            </h2>
            <p>
              ETHER processes repository details on a need-to-know basis. The analyzed files, tree structure, and structural graph calculated from public or authorized repositories are stored in-memory on the backend and are automatically cleared after 30 minutes of inactivity.
            </p>
          </div>

          <div>
            <h2 className="text-md font-semibold text-cyber-blue uppercase tracking-wider mb-2">
              2. Secret Protection
            </h2>
            <p>
              GitHub Personal Access Tokens (PATs) and Gemini API Keys are strictly kept server-side. ETHER does not package, log, or expose secret keys to client bundles or WebWorkers.
            </p>
          </div>

          <div>
            <h2 className="text-md font-semibold text-cyber-blue uppercase tracking-wider mb-2">
              3. Rate Limiting & Safety
            </h2>
            <p>
              To protect the infrastructure from scraping and excessive load, strict tiered rate limiting is active on the analysis (SSE) and AI navigator endpoints.
            </p>
          </div>

          <div>
            <h2 className="text-md font-semibold text-cyber-blue uppercase tracking-wider mb-2">
              4. Prompt Injection Mitigation
            </h2>
            <p>
              The AI Navigator isolates untrusted repository code from its system prompt instructions. Core developer tasks like file structural mapping do not rely on LLM logic, preventing code injection from altering visual structure.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
export default SecurityPage;
