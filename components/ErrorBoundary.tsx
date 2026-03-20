import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
         return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center justify-center p-4">
          <div className="glass p-8 rounded-3xl max-w-lg w-full text-center space-y-4 shadow-2xl border border-red-500/20 bg-red-500/5">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-red-400">
               <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Something went wrong</h2>
            <p className="text-sm text-slate-400 pb-4">
              A component crashed unexpectedly. Don't worry, your data is safe.
            </p>
            
            <div className="p-4 bg-slate-900 rounded-lg text-left overflow-hidden">
               <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap break-words">
                 {this.state.error?.message || 'Unknown Error'}
               </pre>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3 bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-500/20 transition-all font-bold text-white rounded-xl flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
