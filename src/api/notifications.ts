import { api } from "./client";
import type { AppNotification, Page } from "./types";

// The user's inbox, or this install's guest inbox via X-Installation-Id.
export const notifications = {
  notifications: ({ page = 1, perPage = 30, unread }: { page?: number; perPage?: number; unread?: boolean } = {}) =>
    api<Page<AppNotification>>("notifications", {
      query: { page, per_page: perPage, unread: unread ? "true" : undefined },
    }),
  readNotification: (id: number) => api<null>(`notifications/${id}/read`, { method: "PATCH" }),
  readAllNotifications: () => api<null>("notifications/read_all", { method: "PATCH" }),
};
