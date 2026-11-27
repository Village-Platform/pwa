import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Login } from "@/features/account/Auth.jsx";
import { session } from "@/lib/session";
import { S } from "@/lib/strings";

const json = (status, body) => new Response(JSON.stringify(body), { status });

const open = () =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/login", state: { from: "/my-firms" } }]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/my-firms" element={<p>my firms</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe("Login", () => {
  beforeEach(() => {
    session.clear();
    vi.restoreAllMocks();
  });

  const fill = (phone, password) => {
    const [p, pw] = screen.getAllByLabelText(/./, { selector: "input" });
    fireEvent.change(p, { target: { value: phone } });
    fireEvent.change(pw, { target: { value: password } });
    fireEvent.click(screen.getByRole("button", { name: S.login }));
  };

  it("validates before calling the server", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    open();
    fill("123", "");
    expect(screen.getByText(S.errorPhoneInvalid)).toBeInTheDocument();
    expect(screen.getByText(S.errorPasswordRequired)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("signs in and returns to the screen that asked for it", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json(200, { data: { token: "t1", user: { id: 5 } } }));
    open();
    fill("01012345678", "secret123");
    expect(await screen.findByText("my firms")).toBeInTheDocument();
    expect(session.get().user).toEqual({ id: 5 });
  });

  it("shows the server's message for wrong credentials", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      json(401, { error: { code: "invalid_credentials", message: "بيانات الدخول غير صحيحة" } }),
    );
    open();
    fill("01012345678", "wrong");
    await waitFor(() => expect(screen.getByText("بيانات الدخول غير صحيحة")).toBeInTheDocument());
    expect(session.get().user).toBeNull();
  });
});
