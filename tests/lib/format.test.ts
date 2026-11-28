import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  egp,
  formatDate,
  notificationAction,
  normalizeDigits,
  parseCoordinates,
  relativeTime,
  validCoordinates,
  validPhone,
  whatsappUrl,
} from "@/lib/format";
import type { AppNotification } from "@/api/types";

describe("relativeTime", () => {
  const NOW = new Date("2026-11-27T12:00:00Z");
  const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
  const MIN = 60_000;
  const H = 60 * MIN;
  const D = 24 * H;

  beforeEach(() => vi.useFakeTimers().setSystemTime(NOW));
  afterEach(() => vi.useRealTimers());

  it.each([
    [10_000, "الآن"],
    [MIN, "منذ دقيقة"],
    [5 * MIN, "منذ 5 دقيقة"],
    [H, "منذ ساعة"],
    [2 * H, "منذ ساعتين"],
    [5 * H, "منذ 5 ساعات"],
    [12 * H, "منذ 12 ساعة"],
    [D, "منذ يوم"],
    [2 * D, "منذ يومين"],
    [4 * D, "منذ 4 أيام"],
    [8 * D, "منذ أسبوع"],
    [21 * D, "منذ 3 أسابيع"],
  ])("%i ms ago", (ms, text) => expect(relativeTime(ago(ms))).toBe(text));

  it("falls back to the date after a month, and for the future or junk", () => {
    expect(relativeTime(ago(40 * D))).toBe("2026/10/18");
    expect(relativeTime(new Date(NOW.getTime() + H).toISOString())).toBe("2026/11/27");
    expect(relativeTime(null)).toBe("");
  });
});

describe("format helpers", () => {
  it("formats dates with Latin digits", () => expect(formatDate("2026-03-05T10:00:00")).toBe("2026/03/05"));
  it("formats piasters as pounds", () => {
    expect(egp(24900)).toBe("249 ج.م");
    expect(egp(24950)).toBe("249.50 ج.م");
  });
  it("makes wa.me links from local numbers", () =>
    expect(whatsappUrl("01012345678")).toBe("https://wa.me/201012345678"));
  it("validates Egyptian mobile numbers", () => {
    expect(validPhone("01012345678")).toBe(true);
    expect(validPhone("1012345678")).toBe(false);
  });
});

describe("Arabic digits and coordinates", () => {
  it("turns Arabic-Indic and Eastern Arabic-Indic digits into 0-9", () => {
    expect(normalizeDigits("٠١٠١٢٣٤٥٦٧٨")).toBe("01012345678");
    expect(normalizeDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
    expect(normalizeDigits("٣٠٫٥")).toBe("30.5");
    expect(normalizeDigits("abc 12")).toBe("abc 12");
  });

  it("accepts a phone typed with Arabic digits", () => {
    expect(validPhone("٠١٠١٢٣٤٥٦٧٨")).toBe(true);
  });

  it("checks coordinate ranges like the server", () => {
    expect(validCoordinates("", "")).toBe(true);
    expect(validCoordinates("30.28", "31.33")).toBe(true);
    expect(validCoordinates("٣٠٫٢٨", "٣١٫٣٣")).toBe(true);
    expect(validCoordinates("200", "31")).toBe(false);
    expect(validCoordinates("30", "181")).toBe(false);
    expect(validCoordinates("30", "")).toBe(false);
    expect(validCoordinates("abc", "31")).toBe(false);
  });

  it("parses pasted coordinates, even with Arabic digits or a stray %", () => {
    expect(parseCoordinates("https://maps.google.com/?q=30.36,31.21")).toEqual({ lat: 30.36, lng: 31.21 });
    expect(parseCoordinates("٣٠٫٣٦, ٣١٫٢١")).toEqual({ lat: 30.36, lng: 31.21 });
    expect(() => parseCoordinates("100% 30.36,31.21")).not.toThrow();
    expect(parseCoordinates("100% 30.36,31.21")).toEqual({ lat: 30.36, lng: 31.21 });
  });
});

describe("notificationAction", () => {
  const n = (data: AppNotification["data"], kind = ""): AppNotification => ({
    id: 1,
    kind,
    title: "",
    body: "",
    read: false,
    read_at: null,
    created_at: "",
    data,
  });

  it("routes known screens", () => {
    expect(notificationAction(n({ screen: "firm", id: "12" }), { plansOn: true })).toBe("/firms/12");
    expect(notificationAction(n({ screen: "article", id: "5" }), { plansOn: true })).toBe("/news/5");
    expect(notificationAction(n({ screen: "category", id: "3" }), { plansOn: true })).toBe("/explore?category=3");
  });

  it("opens the inbox for a screen it does not know", () => {
    expect(notificationAction(n({ screen: "something_new", id: "1" }), { plansOn: true })).toBe("/notifications");
    expect(notificationAction(n({ screen: "toString" }), { plansOn: true })).toBe("/notifications");
  });

  it("drops plan targets while the plans feature is off", () => {
    expect(notificationAction(n({ screen: "subscription" }), { plansOn: false })).toBeNull();
  });
});
