import { api, installationId } from "./client";

export interface DeviceInput {
  /** FCM registration token for this browser. */
  token: string;
  locale?: string;
  app_version?: string;
  /** The server accepts only "android" today; "web" needs the backend change before push works. */
  platform: "web" | "android";
}

// This browser as a push device, keyed by the installation id (like the Android app's install).
export const devices = {
  /** Registers or refreshes this install's push token. Signed in, the device belongs to the user. */
  registerDevice: (device: DeviceInput) => api<unknown>(`devices/${installationId()}`, { method: "PUT", body: device }),
  /** On logout: the device stops receiving the user's personal notifications. */
  detachDevice: () => api<unknown>(`devices/${installationId()}/detach`, { method: "POST" }),
};
