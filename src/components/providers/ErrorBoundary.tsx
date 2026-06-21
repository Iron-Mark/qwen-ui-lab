"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "../ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  className?: string;
  onCaptureError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    this.props.onCaptureError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={
            this.props.className ??
            "rounded-lg border border-danger/30 bg-danger/5 p-6 text-center"
          }
          role="alert"
        >
          <p className="text-sm font-semibold text-danger">
            {this.props.fallbackTitle ?? "Something went wrong in this section."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
