import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { UrlInput } from '@/components/landing/UrlInput';
import { GalaxyBackground } from '@/components/landing/GalaxyBackground';

export function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-void select-none px-6 py-8">
      {/* Dynamic Star background */}
      <GalaxyBackground />

      <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-10">
        <Logo size="md" />
        <Link
          to="/explore/demo"
          className="text-xs font-mono tracking-wider border border-cyber-purple/40 hover:border-cyber-purple/80 bg-cyber-purple/5 hover:bg-cyber-purple/10 px-4 py-2 rounded text-cyber-purple uppercase transition-all"
        >
          EXPLORE DEMO
        </Link>
      </header>

      <main className="w-full max-w-4xl mx-auto text-center flex flex-col justify-center items-center py-16 z-10">
        <div className="space-y-6 max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-white tracking-wide leading-tight animate-fade-in">
            YOUR CODEBASE AS A <span className="text-cyber-blue shadow-neon-blue">3D UNIVERSE</span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 font-mono leading-relaxed max-w-lg mx-auto">
            Input a public GitHub repository. Watch your codebase transform into an explorable star system of dependencies and files.
          </p>
        </div>

        <div className="w-full mt-10 animate-slide-up">
          <UrlInput />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full mt-20 text-left text-xs font-mono">
          <div className="glass-panel p-5 border-slate-800/80">
            <div className="text-cyber-blue mb-2 font-bold uppercase">&gt; STARS_AND_CONSTELLATIONS</div>
            <div className="text-slate-400 leading-relaxed">
              Files are rendered as stars. Folders form constellations. Size indicates file complexity and visual mass.
            </div>
          </div>
          <div className="glass-panel p-5 border-slate-800/80">
            <div className="text-cyber-purple mb-2 font-bold uppercase">&gt; GRAVITATIONAL_CONNECTIONS</div>
            <div className="text-slate-400 leading-relaxed">
              Bridges indicate active module dependencies. Trace paths, identify bottlenecks, and map the architecture.
            </div>
          </div>
          <div className="glass-panel p-5 border-slate-800/80">
            <div className="text-cyber-amber mb-2 font-bold uppercase">&gt; INTERACTIVE_COGNITION</div>
            <div className="text-slate-400 leading-relaxed">
              Fly through stars, inspect contents, and use ETHER's AI Navigator to query and search the universe.
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-[10px] font-mono text-slate-500 gap-4 mt-8 z-10 border-t border-slate-900/80 pt-6">
        <div>© 2026 ETHER. ALL RIGHTS RESERVED.</div>
        <div className="flex gap-6">
          <Link to="/security" className="hover:text-slate-300 transition-colors uppercase">Security Practices</Link>
          <Link to="/privacy" className="hover:text-slate-300 transition-colors uppercase">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
export default LandingPage;
