import { describe, expect, it } from "vitest";
import { ApiError } from "@/api/client";
import { errorAction, fieldErrors } from "@/lib/errors";

describe("fieldErrors", () => {
  it("takes the first message per field and renames fields", () => {
    const e = new ApiError("x", {
      status: 422,
      code: "validation_failed",
      details: { name: ["مطلوب", "قصير"], working_hours: ["غير صالح"] },
    });
    expect(fieldErrors(e, { working_hours: "workingHours" })).toEqual({ name: "مطلوب", workingHours: "غير صالح" });
  });

  it("is empty for other errors", () => {
    expect(fieldErrors(new ApiError("x", { code: "phone_taken" }))).toEqual({});
    expect(fieldErrors(null)).toEqual({});
    expect(fieldErrors(new ApiError("x", { code: "validation_failed", details: null }))).toEqual({});
  });
});

describe("errorAction", () => {
  it("points a missing subscription at the plans screen", () => {
    expect(errorAction({ code: "subscription_required" })).toMatchObject({ to: "/plans", needs: "plans" });
  });
  it("points a full pending queue at my firms", () => {
    expect(errorAction({ code: "too_many_pending" })).toMatchObject({ to: "/my-firms" });
  });
  it("has nothing for other codes", () => {
    expect(errorAction({ code: "rate_limited" })).toBeNull();
    expect(errorAction(undefined)).toBeNull();
  });
});
