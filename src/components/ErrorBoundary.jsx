import { Component } from "react";
import { S } from "../lib/strings";
import { GoldButton, MessageBox } from "./ui.jsx";

/** Catches render errors so a bug in one screen shows a retry instead of a white page. */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="p-4 text-center">
        <MessageBox text={S.genericError} />
        <GoldButton onClick={() => window.location.reload()}>{S.retry}</GoldButton>
      </div>
    );
  }
}
