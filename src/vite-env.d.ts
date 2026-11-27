/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL. Must end with /api/v1/. */
  readonly VITE_API_URL?: string;
  /** Git SHA of the build (set by CI). */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
