import type { User } from "@/api/types";

/** A fake fetch Response with a JSON body (or none). */
export const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

/** A complete user, for signing in during a test. */
export const testUser = (over: Partial<User> = {}): User => ({
  id: 1,
  name: "Ali",
  phone: "01012345678",
  email: null,
  role: "user",
  ...over,
});

type SentInit = Omit<RequestInit, "headers"> & { headers: Record<string, string> };

/** The URL and init of a call a `vi.spyOn(globalThis, "fetch")` spy recorded (default: the last). */
export function sent(spy: { mock: { calls: unknown[][] } }, index = -1) {
  const call = spy.mock.calls.at(index);
  if (!call) throw new Error("fetch was not called");
  const [url, init] = call as [URL | string, SentInit | undefined];
  return { url: new URL(String(url)), init: { headers: {}, ...init } as SentInit };
}
