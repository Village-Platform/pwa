/** yyyy/MM/dd with Latin digits, like formatDate() in the Android app's Common.kt. */
export function formatDate(iso) {
  const d = iso && new Date(iso);
  if (!d || isNaN(d)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`;
}

// Same wording as relativeTime() in the Android app's ui/components/Common.kt.
export function relativeTime(iso) {
  const d = iso && new Date(iso);
  if (!d || isNaN(d)) return "";
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (minutes < 0) return formatDate(iso);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return minutes === 1 ? "منذ دقيقة" : `منذ ${minutes} دقيقة`;
  if (minutes < 60 * 24) {
    const h = Math.floor(minutes / 60);
    if (h === 1) return "منذ ساعة";
    if (h === 2) return "منذ ساعتين";
    return h <= 10 ? `منذ ${h} ساعات` : `منذ ${h} ساعة`;
  }
  const days = Math.floor(minutes / (60 * 24));
  if (days === 1) return "منذ يوم";
  if (days === 2) return "منذ يومين";
  if (days <= 6) return `منذ ${days} أيام`;
  if (days <= 13) return "منذ أسبوع";
  if (days <= 29) return `منذ ${Math.floor(days / 7)} أسابيع`;
  return formatDate(iso);
}

/** Egyptian local numbers (01xxxxxxxxx) become international (201xxxxxxxxx) for wa.me links. */
export function whatsappUrl(number) {
  const digits = String(number).replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? "2" + digits : digits}`;
}

export const mapUrl = (lat, lng) => `https://maps.google.com/?q=${lat},${lng}`;

export const validPhone = (p) => /^01\d{9}$/.test(p.trim());

export const greeting = (S) => (new Date().getHours() < 12 ? S.goodMorning : S.goodEvening);

/** 24900 piasters -> "249 ج.م" (same as egp() in the Android app). */
export function egp(cents) {
  const pounds = cents / 100;
  return `${Number.isInteger(pounds) ? pounds : pounds.toFixed(2)} ج.م`;
}

export const firmStatusTone = (s) => (s === "pending" ? "gold" : s === "suspended" ? "red" : "green");
export const subscriptionTone = (s) =>
  ({ current: "green", scheduled: "gold", pending: "gold", rejected: "red" })[s] || "gray";
export const kindTone = (k) => (k === "announcement" ? "gold" : k === "article" ? "gray" : "green");

/** Icon name for a notification row, from the server's kind (Common.kt notificationIcon). */
export function notificationIcon(kind = "") {
  if (kind.includes("payment") || kind.includes("subscription")) return "card";
  if (kind.includes("firm")) return "storefront";
  if (kind.includes("article") || kind.includes("news")) return "news";
  if (kind.includes("invit")) return "handshake";
  return "bell";
}

/**
 * Where a notification tap leads: the server's destination (data.screen + data.id), else a guess
 * from its kind. Same table as Android's parseNotificationAction. Returns a path, or null.
 * Plans / payments targets are dropped while the plans flag is off.
 */
export function notificationAction(n, { plansOn }) {
  const screen = n.data?.screen;
  const id = n.data?.id;
  let to = null;
  if (screen && screen !== "none") {
    to =
      {
        article: id ? `/news/${id}` : "/news",
        firm: id ? `/firms/${id}` : "/my-firms",
        category: id ? `/explore?category=${id}` : null,
        subscription: "/payments",
      }[screen] ?? null;
  } else if (n.kind) {
    const k = n.kind;
    if (k.includes("expir") || k.includes("renew")) to = "/plans";
    else if (k.includes("payment") || k.includes("subscription")) to = "/payments";
    else if (k.includes("firm")) to = "/my-firms";
    else if (k.includes("article") || k.includes("news")) to = "/news";
  }
  if (!plansOn && (to === "/plans" || to === "/payments")) return null;
  return to;
}

// Latitude, longitude in text or a Google Maps URL ("30.36,31.21", "@30.36,31.21,17z", "?q=30.36,31.21").
// Same pattern as LocationPicker.parseCoordinates on Android. Short links (maps.app.goo.gl) cannot be
// expanded from the browser (no CORS), so those need the full link or the numbers.
const COORD = /(-?\d{1,2}\.\d+)\s*[,;\s]\s*(-?\d{1,3}\.\d+)/;
export function parseCoordinates(input) {
  const m = decodeURIComponent(String(input)).match(COORD);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}
