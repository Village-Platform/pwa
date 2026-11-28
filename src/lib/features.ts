import { useEffect, useSyncExternalStore } from "react";
import { Api } from "../api/endpoints";

// Server feature flags (GET app_config, toggled in the admin dashboard), same rules as Android's
// data/config/FeatureFlags.kt: read on start and when the app comes back to the foreground, at most
// every 5 minutes; the last answer is kept. Fails closed: a flag the server does not send means off.
// Any key the server sends works: use `useFlag("key")` or <FeatureGate flag="key">. A flag is null
// only while nothing is known (first launch, before the reply); gates stay open while it is null.
const KEY = "aghour.features";
const MIN_INTERVAL = 5 * 60 * 1000;

interface Saved {
  features: Record<string, unknown>;
  /** When it was read, in ms. */
  at: number;
}
type Flags = Record<string, boolean> | null;

const read = (): Saved | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
};

let saved = read();
const listeners = new Set<() => void>();
let snapshot: Flags = toSnapshot(saved);
// null = nothing known yet; otherwise the server's flags, each coerced to a strict boolean.
function toSnapshot(s: Saved | null): Flags {
  if (!s) return null;
  return Object.fromEntries(Object.entries(s.features || {}).map(([k, v]) => [k, v === true]));
}

let inFlight = false;
async function refresh(force = false): Promise<void> {
  if (inFlight || (!force && saved && Date.now() - saved.at < MIN_INTERVAL)) return;
  inFlight = true;
  try {
    const res = await Api.appConfig();
    saved = { features: res.data?.features || {}, at: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Offline or server error: keep the last answer; with none, everything stays off.
    if (!saved) saved = { features: {}, at: 0 };
  } finally {
    inFlight = false;
    snapshot = toSnapshot(saved);
    listeners.forEach((l) => l());
  }
}

export function startFeatureFlags() {
  refresh();
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && refresh());
}

const useSnapshot = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => snapshot,
  );

/** true / false for one flag, or null while nothing is known yet. A flag the server omits is false. */
export function useFlag(key: string): boolean | null {
  const flags = useSnapshot();
  return flags ? flags[key] === true : null;
}

/** Re-read when a screen needs the freshest answer (e.g. a gated screen opened from a deep link). */
export function useRefreshFeatures() {
  useEffect(() => {
    refresh();
  }, []);
}

/** Test helper: forget everything and start from `features` (or from nothing when null). */
export function __setFeaturesForTest(features: Record<string, unknown> | null) {
  saved = features ? { features, at: Date.now() } : null;
  snapshot = toSnapshot(saved);
  listeners.forEach((l) => l());
}
