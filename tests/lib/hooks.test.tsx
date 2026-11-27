import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useLoad, usePaged } from "@/lib/hooks";

describe("useLoad", () => {
  it("loads data and reloads on demand", async () => {
    const fn = vi.fn().mockResolvedValueOnce("a").mockResolvedValueOnce("b");
    const { result } = renderHook(() => useLoad(fn));
    await waitFor(() => expect(result.current.data).toBe("a"));
    await act(() => result.current.reload());
    await waitFor(() => expect(result.current.data).toBe("b"));
  });

  it("keeps the previous data when a reload fails", async () => {
    const fn = vi.fn().mockResolvedValueOnce("a").mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useLoad(fn));
    await waitFor(() => expect(result.current.data).toBe("a"));
    await act(() => result.current.reload());
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.data).toBe("a");
  });
});

describe("usePaged", () => {
  it("appends pages until the last one", async () => {
    const fetchPage = vi.fn((page: number) => Promise.resolve({ data: [page], meta: { total_pages: 2, total: 2 } }));
    const { result } = renderHook(() => usePaged(fetchPage));
    await waitFor(() => expect(result.current.items).toEqual([1]));
    expect(result.current.canLoadMore).toBe(true);
    await act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toEqual([1, 2]));
    expect(result.current.canLoadMore).toBe(false);
  });
});

describe("refresh promises", () => {
  it("usePaged.refresh resolves once the first page is back", async () => {
    let n = 0;
    const fetchPage = vi.fn(() => Promise.resolve({ data: [++n], meta: { total_pages: 1 } }));
    const { result } = renderHook(() => usePaged(fetchPage));
    await waitFor(() => expect(result.current.items).toEqual([1]));
    await act(() => result.current.refresh());
    expect(result.current.items).toEqual([2]);
  });

  it("useLoad ignores an answer that a newer reload has replaced", async () => {
    const answers: Array<(v: string) => void> = [];
    const fn = vi.fn(() => new Promise<string>((r) => answers.push(r)));
    const { result } = renderHook(() => useLoad(fn));
    let second: Promise<void> = Promise.resolve();
    act(() => {
      second = result.current.reload();
    });
    await act(async () => {
      answers[1]("new");
      await second;
      answers[0]("old"); // arrives late
    });
    expect(result.current.data).toBe("new");
  });
});
