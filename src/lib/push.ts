import { Api } from "../api/endpoints";
import { firebaseApp, firebaseConfigured, vapidKey } from "./firebase";
import { track } from "./analytics";

// Web push through Firebase Cloud Messaging. The browser gets an FCM token, and the app registers it as
// this install's device (PUT /devices/:installation_id), like the Android app does with its token.
//
// Requirements, all checked here: the Firebase config and VAPID key in the build, a browser with web push
// (on iPhone only once the app is installed to the Home Screen, iOS 16.4+), the user's permission, and the
// server's `web_push` feature flag. The flag exists because the server accepts only platform "android"
// for devices today; it is turned on once the backend accepts "web".
//
// Incoming pushes are shown by the service worker (public/push-sw.js), which also routes the tap.

const KEY = "aghour.push"; // "on" once the user turned push on in this browser

export type PushState = "unsupported" | "off" | "denied" | "on";

export function pushSupported() {
  return (
    firebaseConfigured &&
    Boolean(vapidKey) &&
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

const read = () => {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
};
const write = (on: boolean) => {
  try {
    if (on) localStorage.setItem(KEY, "on");
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: push still works for this session.
  }
};

export function pushState(): PushState {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return Notification.permission === "granted" && read() ? "on" : "off";
}

async function fcmToken(): Promise<string | null> {
  const app = await firebaseApp();
  if (!app) return null;
  const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) return null;
  // Our own service worker (vite-plugin-pwa) receives the pushes; Firebase must not register its default one.
  const registration = await navigator.serviceWorker.ready;
  return getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration });
}

async function register(): Promise<boolean> {
  const token = await fcmToken();
  if (!token) return false;
  await Api.registerDevice({
    token,
    platform: "web",
    locale: "ar",
    app_version: import.meta.env.VITE_APP_VERSION || "web",
  });
  return true;
}

/** Asks for permission (must follow a tap) and registers this browser for push. */
export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";
  if (!(await register())) return "unsupported";
  write(true);
  track("push_enable");
  return "on";
}

/** Stops showing this app's pushes in this browser. The server drops the token when FCM reports it gone. */
export async function disablePush() {
  write(false);
  if (!pushSupported()) return;
  try {
    const app = await firebaseApp();
    if (!app) return;
    const { getMessaging, deleteToken } = await import("firebase/messaging");
    await deleteToken(getMessaging(app));
  } catch {
    // Nothing more to do: the token stays unused.
  }
}

/**
 * Registers again with the current session: on start (the token may have rotated), after sign-in (the
 * device then belongs to the user and gets their personal notifications) and after sign-out.
 */
export async function refreshPush() {
  if (pushState() !== "on") return;
  try {
    await register();
  } catch {
    // Offline or refused: the next start tries again.
  }
}

/** Call before signing out, while the user's token still works, so the device stops getting their pushes. */
export async function detachPush() {
  if (pushState() !== "on") return;
  try {
    await Api.detachDevice();
  } catch {
    // Signing out goes ahead anyway.
  }
}
