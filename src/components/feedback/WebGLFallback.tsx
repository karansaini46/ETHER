export function WebGLFallback() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-void px-6 text-center font-mono text-accent-primary">
      <div className="technical-panel max-w-md p-8 shadow-technical rounded bg-surface-raised">
        <span className="text-4xl mb-4 block" role="img" aria-label="hardware">🖥️</span>
        <h2 className="text-lg font-medium tracking-wider mb-2 text-primary">WEBGL REQUIRED</h2>
        <p className="text-xs text-secondary mb-6 leading-relaxed">
          ETHER utilizes hardware-accelerated 3D graphics via WebGL to visualize repositories. Your browser or GPU does not currently support WebGL or it is disabled.
        </p>
        <div className="text-xs text-left bg-void border border-primary/5 rounded p-4 mb-6 leading-relaxed text-secondary">
          <p className="font-semibold mb-1 text-primary">To enable WebGL:</p>
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
          className="inline-block px-6 py-2.5 bg-accent-primary/15 hover:bg-accent-primary/25 border border-accent-primary/40 text-primary text-xs font-medium tracking-wider rounded uppercase transition-colors"
        >
          Check WebGL Status
        </a>
      </div>
    </div>
  );
}
export default WebGLFallback;
