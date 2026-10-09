import { Component, type ErrorInfo, type ReactNode } from "react";
import Derby from "./Derby";

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  override render() {
    if (this.state.failed) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold text-foreground">This page didn't load</h1>
            <p className="mt-2 text-muted-foreground">
              Something went wrong. Please refresh to try again.
            </p>
            <a
              href="/"
              className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Go home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      {window.location.pathname === "/" ? (
        <Derby />
      ) : (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="max-w-md text-center">
            <h1 className="text-7xl font-bold text-foreground">404</h1>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
            <a
              href="/"
              className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Go home
            </a>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}
