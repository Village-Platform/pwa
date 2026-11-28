import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, installationId } from "@/api/client";
import { session } from "@/lib/session";
import { json, sent, testUser } from "../helpers";

describe("api client", () => {
  beforeEach(() => {
    session.clear();
    session.setGuestToken(null);
    vi.restoreAllMocks();
  });

  it("keeps one installation id per browser", () => {
    expect(installationId()).toBe(installationId());
  });

  it("fetches a guest token once and sends it with the installation id", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(200, { data: { token: "guest-1" } }))
      .mockResolvedValue(json(200, { data: [] }));
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
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json(401, { error: { code: "unauthorized", message: "x" } }));
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
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
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
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(201, { data: {} }));
    const body = new FormData();
    body.append("subscription[notes]", "hi");
    await api("subscriptions", { method: "POST", body });
    const { init } = sent(fetchMock, 0);
    expect(init.body).toBe(body);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });
});
