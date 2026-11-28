import { S } from "./strings";
import type { ApiError } from "../api/client";

// Whatever was thrown: only an ApiError has a code and details.
const asApiError = (error: unknown) => error as Partial<ApiError> | null | undefined;

export interface ErrorAction {
  label: string;
  /** Route to open. */
  to: string;
  /** A feature flag the target screen is behind: hide the action while it is off. */
  needs?: string;
}

/**
 * What the user can do about a known API error code, besides reading its message.
 * Returns { label, to } (a route) or null. The message itself always comes from the server.
 *
 * To handle a new code: add a case. `needs` names a feature flag the target screen is behind, so the
 * action is hidden while that flag is off.
 */
export function errorAction(error: unknown): ErrorAction | null {
  switch (asApiError(error)?.code) {
    case "subscription_required":
      return { label: S.viewPlans, to: "/plans", needs: "plans" };
    case "too_many_pending":
      return { label: S.viewMyFirms, to: "/my-firms" };
    default:
      return null;
  }
}

/**
 * Server validation errors ({ details: { field: [messages] } }) as { field: firstMessage }.
 * `map` renames server fields to the form's: { working_hours: "workingHours" }.
 * A field the form does not know is returned too, so callers can ignore it or show it.
 */
export function fieldErrors(error: unknown, map: Record<string, string> = {}): Record<string, string> {
  const e = asApiError(error);
  const details = e?.details;
  if (e?.code !== "validation_failed" || !details || typeof details !== "object") return {};
  const out: Record<string, string> = {};
  for (const [field, messages] of Object.entries(details)) {
    const message = Array.isArray(messages) ? messages[0] : messages;
    if (typeof message === "string") out[map[field] ?? field] = message;
  }
  return out;
}
