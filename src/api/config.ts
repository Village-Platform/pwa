import { api } from "./client";
import type { AppConfig, Envelope } from "./types";

// Server feature flags, cached by lib/features.ts.
export const config = {
  appConfig: () => api<Envelope<AppConfig>>("app_config"),
};
