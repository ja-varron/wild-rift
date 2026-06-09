import { Component, type ErrorInfo, type ReactNode } from 'react';

type RuntimeErrorBoundaryProps = {
  children: ReactNode;
};

type RuntimeErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class RuntimeErrorBoundary extends Component<RuntimeErrorBoundaryProps, RuntimeErrorBoundaryState> {
  constructor(props: RuntimeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): RuntimeErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message ?? 'Unknown runtime error.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[RuntimeErrorBoundary] Caught render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-2xl rounded-lg border bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-red-700">Dashboard crashed at runtime</h1>
            <p className="mt-2 text-sm text-slate-700">
              A runtime error occurred while rendering the page. This is now visible instead of a blank screen.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-md bg-slate-100 p-3 text-xs text-slate-800">
              {this.state.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
