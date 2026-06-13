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
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-void px-6 font-mono text-danger">
          <div className="technical-panel max-w-md p-8 text-center shadow-technical rounded bg-surface-raised">
            <span className="text-4xl mb-4 block" role="img" aria-label="alert">⚠️</span>
            <h2 className="text-lg font-medium tracking-wider mb-2 text-primary">SYSTEM EXCEPTION DETECTED</h2>
            <p className="text-xs text-secondary mb-6 leading-relaxed">
              The 3D universe rendering engine encountered an unrecoverable exception.
            </p>
            <div className="bg-void border border-primary/5 rounded p-4 text-xs text-left mb-6 overflow-auto max-h-32 text-danger font-mono">
              {this.state.error?.message || 'Unknown WebGL/Runtime Error'}
            </div>
            <button
              onClick={this.handleReset}
              className="px-6 py-2.5 bg-danger/10 hover:bg-danger/20 border border-danger/35 text-primary text-xs font-medium tracking-wider rounded uppercase transition-colors"
            >
              Return to safe terminal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
