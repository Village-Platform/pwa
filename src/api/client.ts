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

// One in-flight guest-token request shared by every caller (the Home screen fires several at once).
let guestPromise: Promise<string> | null = null;
async function guestToken(): Promise<string> {
  const saved = session.get().guestToken;
  if (saved) return saved;
  guestPromise ??= raw<{ data: { token: string } }>("auth/guest", { method: "POST" })
    .then((res) => {
      session.setGuestToken(res.data.token);
      return res.data.token;
    })
    .finally(() => (guestPromise = null));
  return guestPromise;
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
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : multipart ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(S.networkError);
  }
  const json = res.status === 204 ? null : await res.json().catch(() => null);
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
      // Same rule as Android's AuthInterceptor: a 401 on the user token signs out.
      session.clear();
      throw new ApiError(S.sessionExpired, { status: 401 });
    }
    // The guest token expired: get a fresh one and try once more.
    session.setGuestToken(null);
    return raw<T>(path, { ...opts, token: await guestToken() });
  }
}
