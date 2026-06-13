import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside ETHER:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-void px-6 font-mono text-cyber-red">
          <div className="glass-panel max-w-md p-8 text-center border-cyber-red/30 shadow-neon-red">
            <span className="text-4xl mb-4 block" role="img" aria-label="alert">⚠️</span>
            <h2 className="text-xl font-bold uppercase tracking-wider mb-2">SYSTEM EXCEPTION DETECTED</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              The 3D universe rendering engine encountered an unrecoverable exception.
            </p>
            <div className="bg-black/40 border border-cyber-red/20 rounded p-4 text-xs text-left mb-6 overflow-auto max-h-32 text-red-400 font-mono">
              {this.state.error?.message || 'Unknown WebGL/Runtime Error'}
            </div>
            <button
              onClick={this.handleReset}
              className="px-6 py-2 bg-cyber-red/20 hover:bg-cyber-red/35 border border-cyber-red text-white text-sm font-semibold tracking-wider rounded uppercase transition-colors"
            >
              Return to Safe Space
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
