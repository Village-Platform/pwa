import { session } from "../lib/session";
import { S } from "../lib/strings";

// Must end with /api/v1/ (same contract as the Android app's API_BASE_URL).
export const API_BASE = import.meta.env.VITE_API_URL || "https://aghour.dorfsys.com/api/v1/";

/** Category icon_url etc. are relative to the API host. */
export const assetUrl = (rel: string | null | undefined) => (rel ? new URL(rel, API_BASE).toString() : null);

// One id per browser install, like Android's installation id. Sent on every call: the server keys
// the guest notification inbox and (later) web push registrations by it. Not a secret.
const INSTALL_KEY = "aghour.installationId";
export function installationId() {
  let id = localStorage.getItem(INSTALL_KEY);
  if (!id) {
    id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(INSTALL_KEY, id);
  }
  return id;
}

export class ApiError extends Error {
  status: number;
  code: string | null;
  /** 422 validation_failed: { field: [messages] }. See lib/errors.ts fieldErrors(). */
  details: Record<string, string[] | string> | null;

  constructor(
    message: string,
    {
      status = 0,
      code = null,
      details = null,
    }: { status?: number; code?: string | null; details?: ApiError["details"] } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** A plain object is sent as JSON, FormData as multipart. */
  body?: unknown;
  query?: Record<string, QueryValue>;
}

/** A request that gets no answer in this time fails with a clear message instead of loading forever. */
export const REQUEST_TIMEOUT_MS = 20_000;
/** After the guest token can't be fetched (offline, 429 rate limit, 5xx), wait this long before asking again. */
const GUEST_RETRY_MS = 30_000;

// One in-flight guest-token request shared by every caller (the Home screen fires several at once).
// Resolves to null when no token can be had right now: the request then goes out without one, which
// the server accepts for public reads while API_TOKEN_REQUIRED is unset, instead of every call failing.
let guestPromise: Promise<string | null> | null = null;
let guestRetryAt = 0;
async function guestToken(): Promise<string | null> {
  const saved = session.get().guestToken;
  if (saved) return saved;
  if (Date.now() < guestRetryAt) return null;
  guestPromise ??= raw<{ data: { token: string } }>("auth/guest", { method: "POST" })
    .then((res) => {
      session.setGuestToken(res.data.token);
      return res.data.token;
    })
    .catch(() => {
      guestRetryAt = Date.now() + GUEST_RETRY_MS;
      return null;
    })
    .finally(() => (guestPromise = null));
  return guestPromise;
}

/** Test helper: forget a guest-token failure. */
export function __resetGuestBackoffForTest() {
  guestRetryAt = 0;
}

async function raw<T>(
  path: string,
  { method = "GET", body, query, token }: RequestOptions & { token?: string | null } = {},
): Promise<T> {
  const url = new URL(path, API_BASE);
  for (const [k, v] of Object.entries(query || {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": "ar",
    "X-Installation-Id": installationId(),
  };
  // FormData (file uploads) sets its own multipart Content-Type, with the boundary.
  const multipart = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !multipart) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  let text: string;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : multipart ? (body as FormData) : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    text = res.status === 204 ? "" : await res.text();
  } catch (e) {
    throw new ApiError((e as Error)?.name === "TimeoutError" ? S.timeoutError : S.networkError);
  }
  // An empty body is fine (some writes answer with nothing). A body that is not JSON is not this API:
  // a captive-portal or proxy page. Treat it as an error rather than handing `null` to a screen.
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      if (res.ok) throw new ApiError(S.genericError, { status: res.status });
    }
  }
  if (!res.ok) {
    // The server's { error: { code, message } } envelope already carries an Arabic sentence.
    throw new ApiError(json?.error?.message || S.genericError, {
      status: res.status,
      code: json?.error?.code,
      details: json?.error?.details,
    });
  }
  return json as T;
}

const isAuthPath = (p: string) => p.startsWith("auth/");

/**
 * Every API call goes through here: attaches the user token, or a guest token when signed out,
 * and turns any failure into an ApiError whose message can be shown as-is.
 */
export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (isAuthPath(path)) return raw<T>(path, opts);
  const { token: userToken } = session.get();
  const token = userToken || (await guestToken());
  try {
    return await raw<T>(path, { ...opts, token });
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 401) throw e;
    if (userToken) {
      // Same rule as Android's AuthInterceptor: a 401 on the user token signs out. Only if that token
      // is still the current one: a late answer must not sign out someone who has signed in since.
      if (session.get().token === userToken) session.clear();
      throw new ApiError(S.sessionExpired, { status: 401 });
    }
    // The guest token expired: get a fresh one and try once more.
    session.setGuestToken(null);
    return raw<T>(path, { ...opts, token: await guestToken() });
  }
}
