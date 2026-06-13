import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';

export function PrivacyPage() {
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
          PRIVACY STATEMENT
        </h1>
        <p className="text-sm text-slate-400 font-mono mb-8">
          LAST_UPDATED: 2026-06-13
        </p>

        <section className="space-y-8 text-sm leading-relaxed text-slate-300">
          <div>
            <h2 className="text-md font-semibold text-cyber-blue uppercase tracking-wider mb-2">
              Data Processing
            </h2>
            <p>
              ETHER fetches public file list meta-information and dependencies from GitHub to build a structural representation of your workspace. File contents are parsed server-side to resolve imports, and are never persisted to databases.
            </p>
          </div>

          <div>
            <h2 className="text-md font-semibold text-cyber-blue uppercase tracking-wider mb-2">
              Third Party Services
            </h2>
            <p>
              When using the AI Navigator, graph details and chat history are sent to Google Gemini APIs to provide conversational context. ETHER does not share source code files directly with LLMs unless explicitly requested in your conversational prompts.
            </p>
          </div>

          <div>
            <h2 className="text-md font-semibold text-cyber-blue uppercase tracking-wider mb-2">
              Browser Storage
            </h2>
            <p>
              We use standard browser localStorage to store user-configured preferences such as 3D visualization quality, sound options, and onboarding status.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
export default PrivacyPage;
