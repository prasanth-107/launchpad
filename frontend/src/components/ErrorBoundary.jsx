import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '../lib/observability';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('react_error_boundary_caught', {
      message: error?.message,
      componentStack: errorInfo?.componentStack?.slice(0, 300)
    });
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 text-left">
          <div className="saas-card max-w-lg w-full p-8 border-amber-200/80 bg-gradient-to-b from-white to-amber-50/20 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                View Error Recovery
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Something went wrong displaying this module
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Your preparation progress, assessment attempts, and placement readiness records are completely safe in Supabase.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono">
              <p className="font-semibold text-slate-800">Diagnostic Identifier:</p>
              <p className="truncate text-slate-500 mt-0.5">
                {this.state.error?.message || 'Component render interrupted safely'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload View</span>
              </button>
              {this.props.onNavigate && (
                <button
                  onClick={() => {
                    this.handleReset();
                    this.props.onNavigate('dashboard');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Return to Dashboard</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
