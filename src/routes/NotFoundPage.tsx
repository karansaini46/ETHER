import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-void px-6 text-center font-mono text-cyber-purple animate-fade-in">
      <div className="glass-panel max-w-md p-8 border-cyber-purple/30 shadow-neon-purple">
        <div className="text-6xl font-bold font-display tracking-widest text-white mb-2">
          404
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyber-purple mb-6 font-semibold">
          COORDINATES_LOST_IN_SPACE
        </div>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          The node or subspace you are looking for does not exist in ETHER.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2 bg-cyber-purple/20 hover:bg-cyber-purple/35 border border-cyber-purple text-white text-sm font-semibold tracking-wider rounded uppercase transition-colors"
        >
          Return to Portal
        </Link>
      </div>
    </div>
  );
}
export default NotFoundPage;
