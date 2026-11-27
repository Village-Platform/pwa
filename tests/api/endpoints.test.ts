import { beforeEach, describe, expect, it, vi } from "vitest";
import { Api } from "@/api/endpoints";
import { session } from "@/lib/session";

import { json, sent, testUser } from "../helpers";

beforeEach(() => {
  session.signIn({ token: "t", user: testUser() });
  vi.restoreAllMocks();
});

const lastCall = (spy: Parameters<typeof sent>[0]) => sent(spy);

describe("review, lists and topics", () => {
  it("rejects with a reason", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => json(200, { data: {} }));
    await Api.rejectFirm(5, "بيانات ناقصة");
    const { url, init } = lastCall(spy);
    expect(url.pathname).toMatch(/\/firms\/5\/reject$/);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ reason: "بيانات ناقصة" });
  });

  it("asks for pending items, own articles and unread notifications", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => json(200, { data: [] }));
    await Api.pendingArticles();
    expect(lastCall(spy).url.searchParams.get("review")).toBe("pending");
    await Api.myArticles();
    expect(lastCall(spy).url.searchParams.get("mine")).toBe("true");
    await Api.notifications({ unread: true });
    expect(lastCall(spy).url.searchParams.get("unread")).toBe("true");
    await Api.notifications({});
    expect(lastCall(spy).url.searchParams.has("unread")).toBe(false);
  });

  it("opts in and out of a topic for this install", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => json(200, { data: {} }));
    await Api.optInTopic("news");
    expect(lastCall(spy).url.pathname).toMatch(/\/devices\/[^/]+\/topics\/news$/);
    expect(lastCall(spy).init.method).toBe("PUT");
    await Api.optOutTopic("news");
    expect(lastCall(spy).init.method).toBe("DELETE");
  });
});
