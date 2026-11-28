/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL. Must end with /api/v1/. */
  readonly VITE_API_URL?: string;
  /** Git SHA of the build (set by CI). */
  readonly VITE_APP_VERSION?: string;
  /** Firebase web app config (Firebase console → Project settings → Your apps). All optional. */
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  /** Turns on Analytics (G-XXXXXXX). */
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  /** Web push certificate public key (Cloud Messaging → Web Push certificates). */
  readonly VITE_FIREBASE_VAPID_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
