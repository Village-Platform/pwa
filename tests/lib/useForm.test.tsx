import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { ApiError } from "@/api/client";
import { useForm } from "@/lib/useForm";

type Values = { name: string; workingHours: string };

const setup = (over: Partial<Parameters<typeof useForm<Values, unknown>>[0]> = {}) =>
  renderHook(() =>
    useForm<Values, unknown>({
      initial: { name: "", workingHours: "" },
      validate: (v): Record<string, string> => (v.name ? {} : { name: "required" }),
      submit: vi.fn().mockResolvedValue({ ok: true }),
      onSuccess: vi.fn(),
      fieldMap: { working_hours: "workingHours" },
      ...over,
    }),
  );

describe("useForm", () => {
  it("blocks submit and shows validation errors", async () => {
    const submit = vi.fn();
    const { result } = setup({ submit });
    await act(() => result.current.save());
    expect(result.current.errors).toEqual({ name: "required" });
    expect(submit).not.toHaveBeenCalled();
  });

  it("clears errors when a field changes", async () => {
    const { result } = setup();
    await act(() => result.current.save());
    act(() => result.current.set({ name: "a" }));
    expect(result.current.errors).toEqual({});
  });

  it("submits valid values and calls onSuccess", async () => {
    const submit = vi.fn().mockResolvedValue({ id: 1 });
    const onSuccess = vi.fn();
    const { result } = setup({ submit, onSuccess });
    act(() => result.current.set({ name: "Clinic" }));
    await act(() => result.current.save());
    expect(submit).toHaveBeenCalledWith({ name: "Clinic", workingHours: "" });
    expect(onSuccess).toHaveBeenCalledWith({ id: 1 }, { name: "Clinic", workingHours: "" });
    expect(result.current.busy).toBe(false);
  });

  it("ignores a second save while one is running", async () => {
    let release: (v: unknown) => void = () => {};
    const submit = vi.fn(() => new Promise<unknown>((r) => (release = r)));
    const { result } = setup({ submit });
    act(() => result.current.set({ name: "a" }));
    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.save();
    });
    await act(() => result.current.save());
    expect(submit).toHaveBeenCalledTimes(1);
    await act(async () => {
      release({});
      await first;
    });
  });

  it("maps server validation errors onto fields", async () => {
    const error = new ApiError("bad", {
      status: 422,
      code: "validation_failed",
      details: { working_hours: ["too long"] },
    });
    const { result } = setup({ submit: vi.fn().mockRejectedValue(error) });
    act(() => result.current.set({ name: "a" }));
    await act(() => result.current.save());
    expect(result.current.errors).toEqual({ workingHours: "too long" });
    expect(result.current.error).toBeNull();
  });

  it("keeps other errors as a banner error", async () => {
    const error = new ApiError("quota", { status: 403, code: "subscription_required" });
    const { result } = setup({ submit: vi.fn().mockRejectedValue(error) });
    act(() => result.current.set({ name: "a" }));
    await act(() => result.current.save());
    expect(result.current.error).toBe(error);
  });
});
