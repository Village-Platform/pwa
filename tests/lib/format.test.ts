import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { egp, formatDate, relativeTime, validPhone, whatsappUrl } from "@/lib/format";

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
