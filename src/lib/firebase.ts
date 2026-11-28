import type { FirebaseApp } from "firebase/app";

// Firebase for the web app: Analytics and Cloud Messaging (web push). The web config comes from the
// Firebase console (Project settings → Your apps → Web app) and is set at build time through VITE_FIREBASE_*
// variables. Without it every Firebase feature stays off and the app works as before.
//
// The Firebase SDK is loaded on demand, so a build without the config (or a visitor who never needs it)
// does not download it up front.

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** Web push key pair (Firebase console → Cloud Messaging → Web Push certificates). */
export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/** The minimum Firebase needs to start. */
export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let appPromise: Promise<FirebaseApp | null> | null = null;

/** The Firebase app, started once, or null when the build has no Firebase config. */
export function firebaseApp(): Promise<FirebaseApp | null> {
  if (!firebaseConfigured) return Promise.resolve(null);
  appPromise ??= import("firebase/app")
    .then(({ initializeApp }) => initializeApp(firebaseConfig))
    .catch((e) => {
      console.warn("Firebase could not start", e);
      return null;
    });
  return appPromise;
}
