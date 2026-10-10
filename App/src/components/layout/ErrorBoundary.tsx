import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="my-6 rounded-xl border border-danger/30 bg-danger/10 p-6 text-text-primary">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
            <h3 className="font-semibold text-body">
              {this.props.fallbackTitle ?? 'Something went wrong loading this component'}
            </h3>
          </div>
          <p className="mt-2 text-caption text-text-secondary">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-3 py-1.5 text-caption font-medium hover:bg-elevated transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Try again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
