import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { LotKeepApp } from "@/components/lotkeep-app";
import "@/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <main className="mx-auto max-w-md px-4 py-10 text-foreground">
          <h1 className="text-lg font-medium">DEPO LOT TAKİP</h1>
          <p className="mt-2 text-sm text-muted">{this.state.error.message}</p>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(root).render(
  <StrictMode>
    <Boundary>
      <LotKeepApp />
    </Boundary>
  </StrictMode>,
);
