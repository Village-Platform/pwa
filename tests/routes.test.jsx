import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { guarded, routes, TAB_PATHS } from "@/routes.jsx";
import { session } from "@/lib/session";

describe("route registry", () => {
  it("has no duplicate paths", () => {
    const paths = routes.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("derives the tab bar paths from the tab flag", () => {
    expect(TAB_PATHS).toEqual(["/", "/explore", "/news", "/account"]);
  });

  it("only uses known guards", () => {
    for (const r of routes) expect(() => guarded(r)).not.toThrow();
    expect(() => guarded({ element: <p />, guards: ["nope"] })).toThrow(/Unknown route guard/);
  });

  it("sends a guest from a user-only route to login", () => {
    session.clear();
    render(
      <MemoryRouter initialEntries={["/secret"]}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/secret" element={guarded({ element: <p>secret</p>, guards: ["user"] })} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("login page")).toBeInTheDocument();
  });
});
