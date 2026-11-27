import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetGuestBackoffForTest, api, ApiError, installationId } from "@/api/client";
import { S } from "@/lib/strings";
import { session } from "@/lib/session";
import { json, sent, testUser } from "../helpers";

describe("api client", () => {
  beforeEach(() => {
    session.clear();
    session.setGuestToken(null);
    __resetGuestBackoffForTest();
    vi.restoreAllMocks();
  });

  it("keeps one installation id per browser", () => {
    expect(installationId()).toBe(installationId());
  });

  it("fetches a guest token once and sends it with the installation id", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(200, { data: { token: "guest-1" } }))
      .mockImplementation(async () => json(200, { data: [] }));
    await Promise.all([api("firms"), api("categories")]);
    const guestCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("auth/guest"));
    expect(guestCalls).toHaveLength(1);
    const call = fetchMock.mock.calls.findIndex(([url]) => String(url).includes("/firms"));
    const { init } = sent(fetchMock, call);
    expect(init.headers.Authorization).toBe("Bearer guest-1");
    expect(init.headers["X-Installation-Id"]).toBe(installationId());
  });

  it("signs out when a user token gets a 401", async () => {
    session.signIn({ token: "user-1", user: testUser() });
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      json(401, { error: { code: "unauthorized", message: "x" } }),
    );
    await expect(api("me")).rejects.toMatchObject({ status: 401 });
    expect(session.get().token).toBeNull();
  });

  it("refreshes an expired guest token and retries once", async () => {
    session.setGuestToken("old");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(401, { error: { message: "expired" } }))
      .mockResolvedValueOnce(json(200, { data: { token: "new" } }))
      .mockResolvedValueOnce(json(200, { data: [] }));
    await expect(api("firms")).resolves.toEqual({ data: [] });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("passes the server's message and code through ApiError", async () => {
    session.signIn({ token: "t", user: testUser() });
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      json(422, { error: { code: "subscription_required", message: "اشترك أولًا" } }),
    );
    const err = (await api("firms", { method: "POST", body: {} }).catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("subscription_required");
    expect(err.message).toBe("اشترك أولًا");
  });

  it("turns a network failure into an ApiError", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fail"));
    session.signIn({ token: "t", user: testUser() });
    await expect(api("firms")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("api client uploads", () => {
  it("sends FormData as multipart without forcing a JSON content type", async () => {
    session.signIn({ token: "t", user: testUser() });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => json(201, { data: {} }));
    const body = new FormData();
    body.append("subscription[notes]", "hi");
    await api("subscriptions", { method: "POST", body });
    const { init } = sent(fetchMock, 0);
    expect(init.body).toBe(body);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });
});

describe("api client robustness", () => {
  beforeEach(() => {
    session.clear();
    session.setGuestToken(null);
    __resetGuestBackoffForTest();
    vi.restoreAllMocks();
  });

  it("gives every request a timeout, and says so when it fires", async () => {
    session.signIn({ token: "t", user: testUser() });
    const spy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new DOMException("slow", "TimeoutError"));
    await expect(api("firms")).rejects.toMatchObject({ message: S.timeoutError });
    expect(sent(spy).init.signal).toBeInstanceOf(AbortSignal);
  });

  it("still sends the request when the guest token is rate limited, and backs off", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (url) =>
        String(url).includes("auth/guest")
          ? json(429, { error: { code: "rate_limited", message: "x" } })
          : json(200, { data: [] }),
      );
    await expect(api("firms")).resolves.toEqual({ data: [] });
    expect(sent(spy).init.headers.Authorization).toBeUndefined();
    await api("categories");
    const guestCalls = spy.mock.calls.filter(([url]) => String(url).includes("auth/guest"));
    expect(guestCalls).toHaveLength(1); // no second try within the back-off window
  });

  it("does not sign out a user who signed in again while a request was running", async () => {
    session.signIn({ token: "old", user: testUser({ id: 1 }) });
    let answer: (r: Response) => void = () => {};
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise((r) => (answer = r)));
    const pending = api("me");
    session.signIn({ token: "new", user: testUser({ id: 2 }) });
    answer(json(401, { error: { code: "unauthorized", message: "x" } }));
    await expect(pending).rejects.toMatchObject({ status: 401 });
    expect(session.get().token).toBe("new");
  });

  it("treats a 200 page that is not JSON as an error", async () => {
    session.signIn({ token: "t", user: testUser() });
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () => new Response("<html>login to wifi</html>", { status: 200 }),
    );
    await expect(api("firms")).rejects.toMatchObject({ message: S.genericError });
  });

  it("accepts an empty successful reply", async () => {
    session.signIn({ token: "t", user: testUser() });
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response("", { status: 200 }));
    await expect(api("notifications/1/read", { method: "PATCH" })).resolves.toBeNull();
  });
});
