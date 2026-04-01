import React, { Component, ReactNode } from "react";
import { ChatProvider } from "./ChatContext";

interface Props {
  children: ReactNode;
  fallbackChildren: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Wraps ConvexChatProvider. If Convex queries fail (e.g., functions not yet deployed),
 * this boundary catches the error and renders the AsyncStorage ChatProvider instead.
 */
export class ConvexChatBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) {
      console.warn("[ConvexChatBoundary] Convex error, using AsyncStorage fallback:", error.message);
    }
  }

  render() {
    if (this.state.hasError) {
      return <ChatProvider>{this.props.fallbackChildren}</ChatProvider>;
    }
    return this.props.children;
  }
}
