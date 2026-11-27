import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ChangePassword } from "@/features/account/AccountSecurity.jsx";
import { session } from "@/lib/session";
import { S } from "@/lib/strings";

const json = (status, body) => new Response(JSON.stringify(body), { status });

describe("ChangePassword", () => {
  beforeEach(() => {
    session.signIn({ token: "old-token", user: { id: 1, name: "Ali" } });
    vi.restoreAllMocks();
  });

  const fill = () => {
    render(
      <MemoryRouter>
        <ChangePassword />
      </MemoryRouter>,
    );
    const [password, confirmation] = screen.getAllByLabelText(/./, { selector: "input" });
    return { password, confirmation };
  };

  it("keeps the fresh token the server returns, since older ones are revoked", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => json(200, { data: { id: 1, name: "Ali" }, meta: { token: "new-token" } }));
    const { password, confirmation } = fill();
    fireEvent.change(password, { target: { value: "secret123" } });
    fireEvent.change(confirmation, { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: S.save }));
    await waitFor(() => expect(session.get().token).toBe("new-token"));
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ user: { password: "secret123", password_confirmation: "secret123" } });
  });

  it("does not call the server for a short password", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const { password, confirmation } = fill();
    fireEvent.change(password, { target: { value: "short" } });
    fireEvent.change(confirmation, { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: S.save }));
    expect(screen.getByText(S.errorPasswordShort)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(session.get().token).toBe("old-token");
  });
});
