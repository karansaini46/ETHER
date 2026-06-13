import { Link } from 'react-router-dom';


export function NotFoundPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-void px-6 text-center font-mono text-accent-secondary animate-fade-in">
      <div className="technical-panel max-w-md p-8 shadow-technical rounded bg-surface-raised">
        <div className="text-5xl font-bold tracking-widest text-primary mb-2">
          404
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-accent-secondary mb-6 font-semibold">
          PAGE NOT FOUND
        </div>
        <p className="text-xs text-secondary mb-8 leading-relaxed">
          The requested system node or file path does not exist in ETHER.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 bg-accent-primary/15 hover:bg-accent-primary/25 border border-accent-primary/40 text-primary text-xs font-medium tracking-wider rounded uppercase transition-colors"
        >
          Return to Portal
        </Link>
      </div>
    </div>
  );
}
export default NotFoundPage;
