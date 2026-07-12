import { Component, useEffect, useReducer, type ComponentType, type ReactNode } from "react";

export type HostPanelExtraKind = "caption" | "text";

/**
 * Host-app render slot for the properties inspector (rendered at the bottom of the caption
 * panel and the text panel). The host registers a COMPONENT on `window.__twick_panel_extra`
 * and (optionally, for late registration) dispatches a 'twick-panel-extra-ready' event:
 *
 *   window.__twick_panel_extra = MyPanelSection;           // ({ kind }) => JSX
 *   window.dispatchEvent(new Event('twick-panel-extra-ready'));
 *
 * Safe-by-construction:
 * - Rendered as `<Extra kind=.../>` — NEVER invoked inline. The host component may use hooks;
 *   an inline call would run them in the caller's hook list and crash on selection change.
 * - Same React instance is guaranteed: react is a peerDependency of every twick package.
 * - Absent/invalid global → renders nothing (hosts without the bridge are unaffected).
 * - A crashing host component is contained by an error boundary — the inspector stays alive.
 */
function resolveHostPanelExtra(): ComponentType<{ kind: HostPanelExtraKind }> | null {
  if (typeof window === "undefined") return null;
  try {
    const comp = (window as unknown as { __twick_panel_extra?: unknown }).__twick_panel_extra;
    return typeof comp === "function"
      ? (comp as ComponentType<{ kind: HostPanelExtraKind }>)
      : null;
  } catch {
    return null;
  }
}

class HostPanelExtraBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    // Non-fatal: the host section vanishes, the rest of the inspector keeps working.
    console.error("[twick] host panel extra crashed:", error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function HostPanelExtra({ kind }: { kind: HostPanelExtraKind }) {
  const [, bump] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    window.addEventListener("twick-panel-extra-ready", bump);
    return () => window.removeEventListener("twick-panel-extra-ready", bump);
  }, []);
  const Extra = resolveHostPanelExtra();
  if (!Extra) return null;
  return (
    <HostPanelExtraBoundary>
      <Extra kind={kind} />
    </HostPanelExtraBoundary>
  );
}
