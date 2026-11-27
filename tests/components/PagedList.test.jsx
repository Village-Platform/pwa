import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PagedList from "@/components/PagedList.jsx";
import { ApiError } from "@/api/client";
import { S } from "@/lib/strings";

// jsdom has no IntersectionObserver.
globalThis.IntersectionObserver ??= class {
  observe() {}
  disconnect() {}
};

const list = (over = {}) => ({
  items: [],
  loading: false,
  error: null,
  loadMore: vi.fn(),
  retry: vi.fn(),
  ...over,
});
const show = (l, props = {}) =>
  render(
    <MemoryRouter>
      <PagedList list={l} empty="nothing here" renderItem={(i) => <p key={i}>{`item ${i}`}</p>} {...props} />
    </MemoryRouter>,
  );

describe("PagedList", () => {
  it("renders the rows", () => {
    show(list({ items: [1, 2] }));
    expect(screen.getByText("item 1")).toBeInTheDocument();
    expect(screen.getByText("item 2")).toBeInTheDocument();
    expect(screen.queryByText("nothing here")).not.toBeInTheDocument();
  });

  it("shows the empty message when loaded with no rows", () => {
    show(list());
    expect(screen.getByText("nothing here")).toBeInTheDocument();
  });

  it("does not show the empty message while loading or after an error", () => {
    show(list({ loading: true }));
    expect(screen.queryByText("nothing here")).not.toBeInTheDocument();
  });

  it("shows the server's error message", () => {
    show(list({ error: new ApiError("تعذّر") }));
    expect(screen.getByText("تعذّر")).toBeInTheDocument();
    expect(screen.queryByText("nothing here")).not.toBeInTheDocument();
  });

  it("never shows a technical error text", () => {
    show(list({ error: new TypeError("Cannot read properties of null") }));
    expect(screen.getByText(S.genericError)).toBeInTheDocument();
    expect(screen.queryByText(/Cannot read/)).not.toBeInTheDocument();
  });

  it("follows `items` for the empty message (a client-side filter)", () => {
    show(list({ items: [1] }), { items: [] });
    expect(screen.getByText("nothing here")).toBeInTheDocument();
  });

  it("loads the next page when the end of the list is still visible after a page loads", () => {
    // An observer that reports "visible" every time it starts observing, like a tall screen.
    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class {
      constructor(cb) {
        this.cb = cb;
      }
      observe() {
        this.cb([{ isIntersecting: true }]);
      }
      disconnect() {}
    };
    try {
      const loadMore = vi.fn();
      const { rerender } = show(list({ items: [1], loadMore }));
      expect(loadMore).toHaveBeenCalledTimes(1);
      rerender(
        <MemoryRouter>
          <PagedList
            list={list({ items: [1, 2], loadMore })}
            empty="nothing here"
            renderItem={(i) => <p key={i}>{`item ${i}`}</p>}
          />
        </MemoryRouter>,
      );
      expect(loadMore).toHaveBeenCalledTimes(2);
    } finally {
      globalThis.IntersectionObserver = original;
    }
  });
});
