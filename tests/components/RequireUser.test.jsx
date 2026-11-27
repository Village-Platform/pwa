import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RequireUser from "@/components/RequireUser.jsx";
import { session } from "@/lib/session";

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={["/my-firms"]}>
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route
          path="/my-firms"
          element={
            <RequireUser>
              <p>private</p>
            </RequireUser>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe("RequireUser", () => {
  it("sends guests to login", () => {
    session.clear();
    renderAt();
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("shows the page to signed-in users", () => {
    session.signIn({ token: "t", user: { id: 1 } });
    renderAt();
    expect(screen.getByText("private")).toBeInTheDocument();
  });
});
