"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  /** Rendered when a child throws; `retry` re-mounts the children. */
  fallback: (retry: () => void) => ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Contains a failure to one dashboard region instead of blanking the page. */
export class DashboardErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log only the error name/digest — messages can embed rendered patient content.
    const digest = (error as Error & { digest?: string }).digest ?? "";
    console.error("[dashboard] render error", error.name, digest, info.componentStack?.length ?? 0);
  }

  private retry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) return this.props.fallback(this.retry);
    return this.props.children;
  }
}
