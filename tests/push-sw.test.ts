import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Loads public/push-sw.js the way the browser does (as a plain script with `self` and `clients`) and
// checks how it shows pushes and where a tap goes.
function loadWorker() {
  const handlers: Record<string, (e: unknown) => void> = {};
  const showNotification = vi.fn(() => Promise.resolve());
  const openWindow = vi.fn((_url: string) => Promise.resolve());
  const self = {
    registration: { scope: "https://example.test/pwa/", showNotification },
    addEventListener: (type: string, fn: (e: unknown) => void) => (handlers[type] = fn),
  };
  const clients = { matchAll: () => Promise.resolve([]), openWindow };
  const code = readFileSync(resolve(process.cwd(), "public/push-sw.js"), "utf8");
  new Function("self", "clients", code)(self, clients);
  return { handlers, showNotification, openWindow };
}

const tap = async (data: Record<string, string>) => {
  const { handlers, openWindow } = loadWorker();
  let done: Promise<unknown> = Promise.resolve();
  handlers.notificationclick({ notification: { data, close() {} }, waitUntil: (p: Promise<unknown>) => (done = p) });
  await done;
  return openWindow.mock.calls[0]?.[0];
};

describe("push service worker", () => {
  it("shows the notification from the FCM payload", async () => {
    const { handlers, showNotification } = loadWorker();
    let done: Promise<unknown> = Promise.resolve();
    handlers.push({
      data: {
        json: () => ({ notification: { title: "خبر جديد", body: "تفاصيل" }, data: { screen: "article", id: "5" } }),
      },
      waitUntil: (p: Promise<unknown>) => (done = p),
    });
    await done;
    expect(showNotification).toHaveBeenCalledWith(
      "خبر جديد",
      expect.objectContaining({ body: "تفاصيل", dir: "rtl", data: { screen: "article", id: "5" } }),
    );
  });

  it.each([
    [{ screen: "article", id: "5" }, "https://example.test/pwa/news/5"],
    [{ screen: "firm", id: "12" }, "https://example.test/pwa/firms/12"],
    [{ screen: "category", id: "3" }, "https://example.test/pwa/explore?category=3"],
    [{ screen: "subscription" }, "https://example.test/pwa/payments"],
    [{ screen: "none" }, "https://example.test/pwa/notifications"],
    [{ screen: "something_new", id: "1" }, "https://example.test/pwa/notifications"],
  ])("a tap on %o opens %s", async (data, url) => {
    expect(await tap(data)).toBe(url);
  });
});
