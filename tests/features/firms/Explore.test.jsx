import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Explore from "@/features/firms/Explore.jsx";
import { session } from "@/lib/session";
import { json, testUser } from "../../helpers";

globalThis.IntersectionObserver ??= class {
  observe() {}
  disconnect() {}
};

function Where() {
  const l = useLocation();
  return <p data-testid="where">{l.search}</p>;
}

const open = (entry) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/explore"
          element={
            <>
              <Explore />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

let spy;
beforeEach(() => {
  session.signIn({ token: "t", user: testUser() });
  vi.restoreAllMocks();
  spy = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (url) =>
      String(url).includes("/categories")
        ? json(200, { data: [{ id: 2, name: "صيدليات" }] })
        : json(200, { data: [], meta: { total_pages: 1, total: 0 } }),
    );
});

const firmQueries = () => spy.mock.calls.map(([u]) => new URL(String(u))).filter((u) => u.pathname.endsWith("/firms"));

describe("Explore", () => {
  it("restores the search from the URL", async () => {
    open("/explore?q=صيدلية&category=2");
    expect(await screen.findByDisplayValue("صيدلية")).toBeInTheDocument();
    const last = firmQueries().at(-1);
    expect(last.searchParams.get("q")).toBe("صيدلية");
    expect(last.searchParams.get("category_id")).toBe("2");
  });

  it("writes the search to the URL after typing", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      open("/explore");
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "مخبز" } });
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
      expect(screen.getByTestId("where").textContent).toContain("q=");
      expect(decodeURIComponent(screen.getByTestId("where").textContent)).toContain("مخبز");
    } finally {
      vi.useRealTimers();
    }
  });

  it("ignores a malformed category", async () => {
    open("/explore?category=abc");
    await screen.findByDisplayValue("");
    expect(firmQueries().at(-1).searchParams.has("category_id")).toBe(false);
  });
});
