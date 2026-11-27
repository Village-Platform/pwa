import { api, installationId } from "./client";
import type { Page, Topic } from "./types";

// Push topics people opt into. State is per user when signed in, else per install.
export const topics = {
  topics: () => api<Page<Topic>>("topics"),
  optInTopic: (key: string) =>
    api<unknown>(`devices/${installationId()}/topics/${encodeURIComponent(key)}`, { method: "PUT" }),
  optOutTopic: (key: string) =>
    api<unknown>(`devices/${installationId()}/topics/${encodeURIComponent(key)}`, { method: "DELETE" }),
};
