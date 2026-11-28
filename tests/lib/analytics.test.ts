import { beforeEach, describe, expect, it, vi } from "vitest";

const logEvent = vi.fn();
const setUserId = vi.fn();
const setUserProperties = vi.fn();

vi.mock("@/lib/firebase", () => ({
  firebaseConfigured: true,
  firebaseConfig: { measurementId: "G-TEST" },
  firebaseApp: () => Promise.resolve({ name: "test-app" }),
}));
vi.mock("firebase/analytics", () => ({
  isSupported: () => Promise.resolve(true),
  getAnalytics: () => ({ name: "analytics" }),
  logEvent: (...args: unknown[]) => logEvent(...args),
  setUserId: (...args: unknown[]) => setUserId(...args),
  setUserProperties: (...args: unknown[]) => setUserProperties(...args),
}));

const { reportError, setAnalyticsUser, track, trackScreen } = await import("@/lib/analytics");

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  logEvent.mockClear();
  setUserId.mockClear();
  setUserProperties.mockClear();
});

describe("analytics", () => {
  it("sends events with their parameters", async () => {
    track("search", { search_term: "صيدلية" });
    await flush();
    expect(logEvent).toHaveBeenCalledWith({ name: "analytics" }, "search", { search_term: "صيدلية" });
  });

  it("names screens by route, with ids grouped", async () => {
    trackScreen("/firms/42/edit");
    await flush();
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), "screen_view", {
      firebase_screen: "/firms/:id/edit",
      firebase_screen_class: "/firms/:id/edit",
    });
  });

  it("reports errors as GA4 exception events, within the 100-character limit", async () => {
    reportError(new TypeError("x".repeat(300)), { fatal: true });
    await flush();
    const [, event, params] = logEvent.mock.calls.at(-1)!;
    expect(event).toBe("exception");
    expect(params.fatal).toBe(true);
    expect(params.description.length).toBeLessThanOrEqual(100);
    expect(params.description).toMatch(/^TypeError: x+/);
  });

  it("tags the user by id only, and clears it on sign-out", async () => {
    setAnalyticsUser(7, "firm_admin");
    await flush();
    expect(setUserId).toHaveBeenLastCalledWith(expect.anything(), "7");
    expect(setUserProperties).toHaveBeenLastCalledWith(expect.anything(), { role: "firm_admin" });
    setAnalyticsUser(null);
    await flush();
    expect(setUserId).toHaveBeenLastCalledWith(expect.anything(), null);
  });
});
