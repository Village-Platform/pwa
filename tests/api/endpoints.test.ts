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

describe("public article feed", () => {
  it("keeps drafts, pending, rejected and scheduled articles out (reviewers get them all)", async () => {
    const past = "2020-01-01T00:00:00Z";
    const future = "2999-01-01T00:00:00Z";
    const a = (id: number, review_status: string, published_at: string | null) => ({ id, review_status, published_at });
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      json(200, {
        data: [
          a(1, "approved", past),
          a(2, "approved", null),
          a(3, "pending", past),
          a(4, "rejected", past),
          a(5, "approved", future),
          { id: 6, published_at: past },
        ],
        meta: { total_pages: 1 },
      }),
    );
    const res = await Api.articles();
    expect(res.data.map((x) => x.id)).toEqual([1, 6]);
  });
});
