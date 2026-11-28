import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { session } from "@/lib/session";
import { json, sent, testUser } from "../helpers";

const getToken = vi.fn();
vi.mock("@/lib/firebase", () => ({
  firebaseConfigured: true,
  firebaseConfig: {},
  vapidKey: "VAPID",
  firebaseApp: () => Promise.resolve({ name: "test-app" }),
}));
vi.mock("firebase/messaging", () => ({
  isSupported: () => Promise.resolve(true),
  getMessaging: () => ({ name: "messaging" }),
  getToken: (...args: unknown[]) => getToken(...args),
  deleteToken: () => Promise.resolve(true),
}));

const { detachPush, enablePush, pushState, refreshPush } = await import("@/lib/push");

const registration = { scope: "https://example.test/pwa/" };
// A writable stand-in for the browser's Notification API.
const fakeNotification = {
  permission: "default" as NotificationPermission,
  requestPermission: vi.fn<() => Promise<NotificationPermission>>(),
};
const answer = (permission: NotificationPermission) =>
  fakeNotification.requestPermission.mockImplementation(async () => {
    fakeNotification.permission = permission;
    return permission;
  });

beforeEach(() => {
  vi.restoreAllMocks();
  getToken.mockReset().mockResolvedValue("fcm-token-1");
  session.signIn({ token: "t", user: testUser() });
  Object.defineProperty(navigator, "serviceWorker", {
    value: { ready: Promise.resolve(registration) },
    configurable: true,
  });
  Object.assign(window, { PushManager: function PushManager() {} });
  Object.defineProperty(window, "Notification", { value: fakeNotification, configurable: true });
  fakeNotification.permission = "default";
});

afterEach(() => {
  localStorage.clear();
});

describe("web push", () => {
  it("asks for permission, gets an FCM token with our service worker, and registers this browser", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => json(200, { data: {} }));
    answer("granted");
    await expect(enablePush()).resolves.toBe("on");
    expect(getToken).toHaveBeenCalledWith(
      { name: "messaging" },
      { vapidKey: "VAPID", serviceWorkerRegistration: registration },
    );
    const { url, init } = sent(spy);
    expect(url.pathname).toMatch(/\/devices\/[^/]+$/);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toMatchObject({ token: "fcm-token-1", platform: "web", locale: "ar" });
    expect(pushState()).toBe("on");
  });

  it("does nothing more when the user says no", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    answer("denied");
    await expect(enablePush()).resolves.toBe("denied");
    expect(spy).not.toHaveBeenCalled();
    expect(pushState()).toBe("denied");
  });

  it("detaches the device before sign-out, only when push is on", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => json(200, { data: {} }));
    await detachPush();
    expect(spy).not.toHaveBeenCalled(); // push is off: nothing to detach

    fakeNotification.permission = "granted";
    localStorage.setItem("aghour.push", "on");
    await detachPush();
    const { url, init } = sent(spy);
    expect(url.pathname).toMatch(/\/devices\/[^/]+\/detach$/);
    expect(init.method).toBe("POST");
  });

  it("re-registers on start or after sign-in when push is on, and never throws", async () => {
    fakeNotification.permission = "granted";
    localStorage.setItem("aghour.push", "on");
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => json(422, { error: { code: "x", message: "x" } }));
    await expect(refreshPush()).resolves.toBeUndefined();
  });
});
