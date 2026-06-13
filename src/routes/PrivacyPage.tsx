import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';

export function PrivacyPage() {
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
          PRIVACY STATEMENT
        </h1>
        <p className="text-[10px] text-secondary/60 mb-8">
          Last Updated: June 13, 2026
        </p>

        <section className="space-y-8 text-[11px] leading-relaxed text-secondary">
          <div>
            <h2 className="text-xs font-semibold text-accent-secondary uppercase tracking-wider mb-2">
              Data Processing
            </h2>
            <p>
              ETHER fetches public file list meta-information and dependencies from GitHub to build a structural representation of your workspace. File contents are parsed server-side to resolve imports, and are never persisted to databases.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-accent-secondary uppercase tracking-wider mb-2">
              Third Party Services
            </h2>
            <p>
              When using the AI Navigator, graph details and chat history are sent to Google Gemini APIs to provide conversational context. ETHER does not share source code files directly with LLMs unless explicitly requested in your conversational prompts.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-accent-secondary uppercase tracking-wider mb-2">
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
