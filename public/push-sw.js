/* global clients */
// Imported into the generated service worker (vite.config.js, workbox.importScripts). Shows Firebase Cloud
// Messaging pushes and opens the right screen when one is tapped. Plain JavaScript: service workers can't
// use the app's modules.
//
// Payload (docs/architecture/integrations.md): a `notification` block (title, body) and string `data`
// with `screen` (none, article, firm, category, subscription) and `id`.

const scope = new URL(self.registration.scope); // e.g. https://village-platform.github.io/pwa/
const base = scope.pathname; // "/pwa/"

/** Same table as notificationAction() in src/lib/format.ts. Unknown screens open the inbox. */
function pathFor(data) {
  const screen = data && data.screen;
  const id = data && data.id;
  switch (screen) {
    case "article":
      return id ? `news/${id}` : "news";
    case "firm":
      return id ? `firms/${id}` : "my-firms";
    case "category":
      return id ? `explore?category=${id}` : "explore";
    case "subscription":
      return "payments";
    default:
      return "notifications";
  }
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { notification: { body: event.data && event.data.text() } };
  }
  const data = payload.data || {};
  const notification = payload.notification || {};
  const title = notification.title || data.title || "أجهور الكبرى";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: notification.body || data.body || "",
      icon: `${base}icons/icon-192.png`,
      badge: `${base}icons/favicon-32.png`,
      dir: "rtl",
      lang: "ar",
      tag: data.notification_id || data.campaign_id || undefined,
      data,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(pathFor(event.notification.data), scope).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(scope.href));
      if (open) return open.focus().then((w) => w.navigate(url));
      return clients.openWindow(url);
    }),
  );
});
