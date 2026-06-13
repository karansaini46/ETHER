export function WebGLFallback() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-void px-6 text-center font-mono text-cyber-amber">
      <div className="glass-panel max-w-md p-8 border-cyber-amber/30 shadow-neon-blue">
        <span className="text-4xl mb-4 block" role="img" aria-label="hardware">🖥️</span>
        <h2 className="text-xl font-bold uppercase tracking-wider mb-2 text-white">WEBGL REQUIRED</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          ETHER utilizes hardware-accelerated 3D graphics via WebGL to visualize repositories. Your browser or GPU does not currently support WebGL or it is disabled.
        </p>
        <div className="text-xs text-left bg-black/40 border border-cyber-amber/20 rounded p-4 mb-6 leading-relaxed text-amber-400">
          <p className="font-semibold mb-1">To enable WebGL:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Ensure hardware acceleration is enabled in browser settings.</li>
            <li>Update your graphics device drivers.</li>
            <li>Try a modern browser like Chrome, Firefox, or Edge.</li>
          </ul>
        </div>
        <a
          href="https://get.webgl.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-2 bg-cyber-amber/20 hover:bg-cyber-amber/35 border border-cyber-amber text-white text-sm font-semibold tracking-wider rounded uppercase transition-colors"
        >
          Check WebGL Status
        </a>
      </div>
    </div>
  );
}
export default WebGLFallback;
