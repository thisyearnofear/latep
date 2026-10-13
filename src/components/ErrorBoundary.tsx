import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Receipt } from "./receipt";
import "../styles/ui.css";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="ui-error">
          <Receipt title="Error">
            <div className="ui-error__body">
              <AlertTriangle size={32} className="ui-error__icon" aria-hidden />
              <h2 className="ui-error__title">Something went wrong</h2>
              <p className="ui-error__message">
                {this.state.error?.message || "An unexpected error occurred."}
              </p>
              <div className="ui-error__actions">
                <button
                  type="button"
                  className="ui-button ui-button--on-receipt"
                  onClick={() => window.location.reload()}
                >
                  Reload page
                </button>
                <button
                  type="button"
                  className="ui-button ui-button--on-receipt"
                  onClick={this.handleReset}
                >
                  Try again
                </button>
              </div>
            </div>
          </Receipt>
        </div>
      );
    }

    return this.props.children;
  }
}
