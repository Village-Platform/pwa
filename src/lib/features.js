import { useEffect, useSyncExternalStore } from "react";
import { api } from "../api/client.js";

// Server feature flags (GET app_config, toggled in the admin dashboard), same rules as Android's
// data/config/FeatureFlags.kt: read on start and when the app comes back to the foreground, at most
// every 5 minutes; the last answer is kept. Fails closed: no answer yet, or a flag the server does
// not send, means off. `plans` is null only while nothing is known (first launch, before the reply).
const KEY = "aghour.features";
const MIN_INTERVAL = 5 * 60 * 1000;

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
};

let saved = read(); // { features: {...}, at: ms } | null
const listeners = new Set();
let snapshot = toSnapshot(saved);
function toSnapshot(s) {
  return { plans: s ? s.features?.plans === true : null };
}

let inFlight = false;
async function refresh(force = false) {
  if (inFlight || (!force && saved && Date.now() - saved.at < MIN_INTERVAL)) return;
  inFlight = true;
  try {
    const res = await api("app_config");
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

export function useFeatures() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => snapshot,
  );
}

/** Re-read when a screen needs the freshest answer (e.g. a gated screen opened from a deep link). */
export function useRefreshFeatures() {
  useEffect(() => {
    refresh();
  }, []);
}
