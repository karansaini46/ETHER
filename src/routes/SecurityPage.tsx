import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';

export function SecurityPage() {
  return (
    <div className="min-h-screen bg-void px-6 py-12 flex flex-col items-center overflow-y-auto font-mono text-xs">
      <header className="w-full max-w-4xl flex items-center justify-between mb-12">
        <Link to="/">
          <Logo size="sm" />
        </Link>
        <Link to="/" className="text-[10px] font-mono text-accent-secondary hover:underline">
          &lt; Back to home
        </Link>
      </header>
      <main className="w-full max-w-2xl technical-panel p-8 md:p-12 shadow-technical rounded bg-surface-raised">
        <h1 className="text-xl md:text-2xl font-semibold text-primary tracking-wide mb-6">
          SECURITY PRACTICES
        </h1>
        <p className="text-[10px] text-secondary/60 mb-8">
          Last Updated: June 13, 2026
        </p>

        <section className="space-y-8 text-[11px] leading-relaxed text-secondary">
          <div>
            <h2 className="text-xs font-semibold text-accent-secondary uppercase tracking-wider mb-2">
              1. Local-First Design
            </h2>
            <p>
              ETHER processes repository details on a need-to-know basis. The analyzed files, tree structure, and structural graph calculated from public or authorized repositories are stored in-memory on the backend and are automatically cleared after 30 minutes of inactivity.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-accent-secondary uppercase tracking-wider mb-2">
              2. Secret Protection
            </h2>
            <p>
              GitHub Personal Access Tokens (PATs) and Gemini API Keys are strictly kept server-side. ETHER does not package, log, or expose secret keys to client bundles or WebWorkers.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-accent-secondary uppercase tracking-wider mb-2">
              3. Rate Limiting & Safety
            </h2>
            <p>
              To protect the infrastructure from scraping and excessive load, strict tiered rate limiting is active on the analysis (SSE) and AI navigator endpoints.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-accent-secondary uppercase tracking-wider mb-2">
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
