import type { Analytics } from "firebase/analytics";
import { firebaseApp, firebaseConfig } from "./firebase";

// Usage analytics and error reporting through Firebase Analytics (Google Analytics 4), the web side of
// what the Android app sends to Firebase Analytics and Crashlytics. Crashlytics has no web SDK, so errors
// are sent as GA4 "exception" events.
//
// Every function is safe to call at any time: before Firebase starts, without a config, or where the
// browser does not support Analytics, they do nothing (and log in development).

/** Event names. Keep them in snake_case (GA4 rule) and stable: dashboards are built on them. */
export type AnalyticsEvent =
  | "screen_view"
  | "login"
  | "sign_up"
  | "search"
  | "share"
  | "contact_firm"
  | "notification_open"
  | "firm_submit"
  | "article_submit"
  | "subscription_request"
  | "push_enable"
  | "exception";

export type EventParams = Record<string, string | number | boolean | undefined>;

let analyticsPromise: Promise<Analytics | null> | null = null;

function analytics(): Promise<Analytics | null> {
  if (!firebaseConfig.measurementId) return Promise.resolve(null);
  analyticsPromise ??= firebaseApp()
    .then(async (app) => {
      if (!app) return null;
      const { getAnalytics, isSupported } = await import("firebase/analytics");
      return (await isSupported()) ? getAnalytics(app) : null;
    })
    .catch(() => null);
  return analyticsPromise;
}

/** Starts Analytics early so the first screen view is counted. */
export function initAnalytics() {
  void analytics();
}

export function track(event: AnalyticsEvent, params: EventParams = {}) {
  if (import.meta.env.DEV && import.meta.env.MODE !== "test") console.debug("[analytics]", event, params);
  void analytics().then(async (a) => {
    if (!a) return;
    const { logEvent } = await import("firebase/analytics");
    // Firebase's typings only list its own event names; ours are custom events, which GA4 accepts.
    (logEvent as (a: Analytics, e: string, p?: EventParams) => void)(a, event, params);
  });
}

/** One event per screen, with the route as its name (ids replaced so screens group together). */
export function trackScreen(pathname: string) {
  const screen = pathname.replace(/\/\d+(?=\/|$)/g, "/:id") || "/";
  track("screen_view", { firebase_screen: screen, firebase_screen_class: screen });
}

/** Ties events to the signed-in user (their numeric id, never personal data); null when signed out. */
export function setAnalyticsUser(userId: number | null, role?: string) {
  void analytics().then(async (a) => {
    if (!a) return;
    const { setUserId, setUserProperties } = await import("firebase/analytics");
    setUserId(a, userId == null ? null : String(userId));
    setUserProperties(a, { role: role ?? "guest" });
  });
}

/** Sends an error as a GA4 "exception" event. GA4 limits a parameter to 100 characters. */
export function reportError(error: unknown, { fatal = false }: { fatal?: boolean } = {}) {
  const err = error instanceof Error ? error : new Error(String(error));
  const description = `${err.name}: ${err.message}`.slice(0, 100);
  track("exception", { description, fatal, screen: location.pathname.slice(0, 100) });
}

let errorReportingInstalled = false;

/** Reports uncaught errors and unhandled promise rejections (render errors come from the ErrorBoundary). */
export function installErrorReporting() {
  if (errorReportingInstalled) return;
  errorReportingInstalled = true;
  window.addEventListener("error", (e) => reportError(e.error ?? e.message, { fatal: true }));
  window.addEventListener("unhandledrejection", (e) => reportError(e.reason));
}
