import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { UrlInput } from '@/components/landing/UrlInput';
import { GalaxyBackground } from '@/components/landing/GalaxyBackground';

export function LandingPage() {
  return (
    <div className="landing-wrapper text-primary font-interface overflow-x-clip selection:bg-accent-primary/30 select-none tech-grid film-grain flex flex-col">
      {/* 1. Header Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-primary/5 z-20">
        <div className="flex items-center gap-12">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-mono tracking-wider text-secondary">
            <a href="#product" className="hover:text-primary transition-colors">PRODUCT</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">HOW IT WORKS</a>
            <Link to="/security" className="hover:text-primary transition-colors">SECURITY</Link>
            <a 
              href="https://github.com/karansaini46/ETHER" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary transition-colors"
            >
              GITHUB
            </a>
          </nav>
        </div>

        <Link
          to="/explore/demo"
          className="text-[10px] font-mono tracking-widest border border-primary/15 hover:border-primary/40 bg-surface-raised hover:bg-surface-secondary px-4 py-2 rounded text-primary transition-all duration-300"
        >
          OPEN DEMO UNIVERSE
        </Link>
      </header>

      {/* 2. Hero Section (Asymmetric Grid) */}
      <section id="product" className="relative w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-12 lg:pt-20 pb-20 items-stretch flex-grow">
        {/* Left Side: Editorial Branding & Repo Input */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-8 z-10">
          <div className="space-y-4">
            <span className="inline-block mono-label uppercase text-accent-secondary tracking-widest text-[9px] border border-accent-secondary/20 px-2 py-0.5 rounded">
              CINEMATIC CODE CARTOGRAPHY
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight text-primary leading-[1.15]">
              See the architecture hiding inside your code.
            </h1>
            <p className="text-sm text-secondary leading-relaxed max-w-md">
              Turn any GitHub repository into an explorable map of files, systems, and dependencies. Discover complexities instantly.
            </p>
          </div>

          {/* Repo Input Box */}
          <div className="w-full max-w-md technical-panel p-6 rounded shadow-technical bg-surface-raised/80 backdrop-blur-sm">
            <span className="mono-label block mb-3 uppercase tracking-wider text-[9px] text-accent-primary">
              [SYSTEM_ANALYZER_PROMPT]
            </span>
            <UrlInput />
            <div className="mt-4 flex items-center justify-between text-[9px] font-mono text-secondary/50">
              <span>SECURITY: READ_ONLY_TOKEN</span>
              <span>NO KEYS STORED IN CLIENT</span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-secondary/60 flex items-center gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-pulse" />
            <span>Ready for analysis of public JS, TS, and JSX codebases</span>
          </div>
        </div>

        {/* Right Side: Cropped 3D Preview (Integrated) */}
        <div className="lg:col-span-7 relative min-h-[300px] lg:min-h-[500px] rounded border border-primary/5 overflow-hidden bg-surface-raised/30">
          {/* Decorative Technical Border Ticks */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-primary/20" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-primary/20" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-primary/20" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-primary/20" />
          
          <GalaxyBackground />
        </div>
      </section>

      {/* 3. Editorial Product Narrative */}
      <section id="how-it-works" className="w-full border-t border-primary/5 bg-[#0b0b0b]/60 py-24 z-10">
        <div className="max-w-5xl mx-auto px-6 space-y-32">
          
          {/* Narrative Item 1: Map the system */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="w-full md:w-1/2 space-y-4">
              <span className="mono-label text-[9px] text-accent-secondary block uppercase tracking-widest">
                [01 / CLUSTER_CLASSIFICATION]
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-medium tracking-tight text-primary">
                Map the system
              </h2>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                Folders form structural constellations. File coordinates are solved in multi-dimensional vector space, sizing elements proportionally to their complexity and mass.
              </p>
              <div className="text-[10px] font-mono text-secondary/40 pt-2">
                COORD_RESOLVER: FORCE_DIRECTED_PHYSICS
              </div>
            </div>
            
            <div className="w-full md:w-1/2 aspect-video bg-surface-raised rounded border border-primary/5 flex items-center justify-center p-6 relative overflow-hidden">
              {/* Technical diagram wireframe */}
              <div className="absolute inset-4 border border-dashed border-primary/5 rounded flex items-center justify-center">
                <svg className="w-4/5 h-4/5 stroke-primary/10 fill-none" viewBox="0 0 200 120">
                  <circle cx="100" cy="60" r="40" strokeDasharray="3 3" />
                  <circle cx="100" cy="60" r="10" />
                  <line x1="100" y1="60" x2="60" y2="40" />
                  <line x1="100" y1="60" x2="140" y2="30" />
                  <line x1="100" y1="60" x2="110" y2="100" />
                  <circle cx="60" cy="40" r="4" className="fill-accent-primary stroke-none" />
                  <circle cx="140" cy="30" r="6" className="fill-accent-selected stroke-none" />
                  <circle cx="110" cy="100" r="5" className="fill-[#ECE9E1] stroke-none" />
                  {/* Annotations */}
                  <text x="70" y="38" className="fill-secondary/60 font-mono text-[6px]" stroke="none">src/auth</text>
                  <text x="148" y="32" className="fill-secondary/60 font-mono text-[6px]" stroke="none">server/db</text>
                </svg>
              </div>
              <span className="absolute bottom-3 right-4 font-mono text-[8px] text-secondary/30">SYSTEM_MODEL_WIRING_PREVIEW</span>
            </div>
          </div>

          {/* Narrative Item 2: Trace the impact */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
            <div className="w-full md:w-1/2 space-y-4">
              <span className="mono-label text-[9px] text-accent-primary block uppercase tracking-widest">
                [02 / DEPENDENCY_PROPAGATION]
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-medium tracking-tight text-primary">
                Trace the impact
              </h2>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                Gravitational connections illuminate imports. Instantly visualize downstream dependents and upstream modules to assess deletion safety and risk coverage.
              </p>
              <div className="text-[10px] font-mono text-secondary/40 pt-2">
                ANALYSIS_ENGINE: AST_IMPORT_PARSER
              </div>
            </div>
            
            <div className="w-full md:w-1/2 aspect-video bg-surface-raised rounded border border-primary/5 flex items-center justify-center p-6 relative overflow-hidden">
              <div className="absolute inset-4 border border-dashed border-primary/5 rounded flex items-center justify-center">
                <svg className="w-4/5 h-4/5 stroke-primary/10 fill-none" viewBox="0 0 200 120">
                  <path d="M 30,80 Q 100,20 170,80" className="stroke-accent-selected/40" strokeWidth="1.5" />
                  <path d="M 30,80 Q 90,90 170,80" strokeDasharray="2 2" />
                  <line x1="30" y1="80" x2="60" y2="40" strokeWidth="0.5" />
                  <line x1="170" y1="80" x2="130" y2="100" strokeWidth="0.5" />
                  
                  <circle cx="30" cy="80" r="5" className="fill-[#ECE9E1] stroke-none" />
                  <circle cx="170" cy="80" r="6" className="fill-accent-selected stroke-none" />
                  <circle cx="60" cy="40" r="3" className="fill-secondary/60 stroke-none" />
                  <circle cx="130" cy="100" r="4" className="fill-secondary/60 stroke-none" />
                  {/* Highlight indicator path */}
                  <circle cx="100" cy="50" r="2" className="fill-accent-selected animate-ping" />
                </svg>
              </div>
              <span className="absolute bottom-3 right-4 font-mono text-[8px] text-secondary/30">DEP_INVERSE_FLOW_MAP</span>
            </div>
          </div>

          {/* Narrative Item 3: Ask the architecture */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="w-full md:w-1/2 space-y-4">
              <span className="mono-label text-[9px] text-accent-selected block uppercase tracking-widest">
                [03 / AI_NAVIGATOR_COGNITION]
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-medium tracking-tight text-primary">
                Ask the architecture
              </h2>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                Query ETHER's AI Navigator using natural language commands. Prompt systems to isolate directories, explain files, or highlight high-risk dependencies in real-time.
              </p>
              <div className="text-[10px] font-mono text-secondary/40 pt-2">
                LLM_ROUTING: GEMINI_LANGCHAIN_PIPELINE
              </div>
            </div>
            
            <div className="w-full md:w-1/2 aspect-video bg-surface-raised rounded border border-primary/5 flex flex-col justify-between p-5 relative overflow-hidden font-mono text-[10px] text-secondary">
              <div className="border border-primary/10 bg-surface-secondary/70 p-3 rounded space-y-2">
                <div className="text-accent-secondary">&gt; Take me to authentication files.</div>
                <div className="text-primary/75 leading-relaxed">
                  Isolating /src/auth cluster... Camera zooming to auth-handler.ts. Highlighting 4 dependency edges.
                </div>
              </div>
              <div className="flex items-center justify-between text-[8px] text-secondary/30 pt-4 border-t border-primary/5">
                <span>INTEL_BOT: RUNNING</span>
                <span>CMD: focusNodes(["src/auth/handler.ts"])</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono text-secondary/50 gap-4 border-t border-primary/5 z-20">
        <div>© 2026 ETHER. SYSTEM CARTOGRAPHY LABS.</div>
        <div className="flex gap-8">
          <Link to="/security" className="hover:text-primary transition-colors">SECURITY PRACTICES</Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">PRIVACY POLICY</Link>
        </div>
      </footer>
    </div>
  );
}
export default LandingPage;
