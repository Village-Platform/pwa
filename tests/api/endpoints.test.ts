import { beforeEach, describe, expect, it, vi } from "vitest";
import { Api } from "@/api/endpoints";
import { session } from "@/lib/session";

import { json, sent, testUser } from "../helpers";

beforeEach(() => {
  session.signIn({ token: "t", user: testUser() });
  vi.restoreAllMocks();
});

const lastCall = (spy: Parameters<typeof sent>[0]) => sent(spy);

describe("lists and topics", () => {
  it("asks for own articles and unread notifications", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(200, { data: [] }));
    await Api.myArticles();
    expect(lastCall(spy).url.searchParams.get("mine")).toBe("true");
    await Api.notifications({ unread: true });
    expect(lastCall(spy).url.searchParams.get("unread")).toBe("true");
    await Api.notifications({});
    expect(lastCall(spy).url.searchParams.has("unread")).toBe(false);
  });

  it("opts in and out of a topic for this install", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(200, { data: {} }));
    await Api.optInTopic("news");
    expect(lastCall(spy).url.pathname).toMatch(/\/devices\/[^/]+\/topics\/news$/);
    expect(lastCall(spy).init.method).toBe("PUT");
    await Api.optOutTopic("news");
    expect(lastCall(spy).init.method).toBe("DELETE");
  });
});
