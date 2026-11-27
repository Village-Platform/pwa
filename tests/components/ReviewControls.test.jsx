import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReviewControls from "@/components/ReviewControls.jsx";
import RequireReviewer from "@/components/RequireReviewer.jsx";
import { session } from "@/lib/session";
import { S } from "@/lib/strings";

const json = (status, body) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  session.signIn({ token: "t", user: { id: 1, role: "admin" } });
  vi.restoreAllMocks();
});

const show = (props) =>
  render(
    <MemoryRouter>
      <ReviewControls kind="firm" id={5} {...props} />
    </MemoryRouter>,
  );

describe("ReviewControls", () => {
  it("approves and hands back the server's record", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(200, { data: { id: 5, status: "active" } }));
    const onChanged = vi.fn();
    show({ onChanged });
    fireEvent.click(screen.getByRole("button", { name: S.approve }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith({ id: 5, status: "active" }));
    expect(new URL(spy.mock.calls.at(-1)[0]).pathname).toMatch(/\/firms\/5\/approve$/);
  });

  it("will not reject without a reason", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    show();
    fireEvent.click(screen.getByRole("button", { name: S.reject }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog.querySelector("button")); // the confirm button comes first
    expect(screen.getByText(S.rejectReasonRequired)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects with the reason", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(200, { data: { id: 5, status: "suspended" } }));
    const onChanged = vi.fn();
    show({ onChanged });
    fireEvent.click(screen.getByRole("button", { name: S.reject }));
    fireEvent.change(screen.getByLabelText(S.rejectReason), { target: { value: "بيانات ناقصة" } });
    fireEvent.click(screen.getByRole("dialog").querySelector("button"));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(JSON.parse(spy.mock.calls.at(-1)[1].body)).toEqual({ reason: "بيانات ناقصة" });
  });

  it("shows the server's message when it refuses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      json(422, { error: { code: "already_reviewed", message: "تمت مراجعته" } }),
    );
    show();
    fireEvent.click(screen.getByRole("button", { name: S.approve }));
    expect(await screen.findByText("تمت مراجعته")).toBeInTheDocument();
  });
});

describe("RequireReviewer", () => {
  const open = () =>
    render(
      <MemoryRouter>
        <RequireReviewer>
          <p>queue</p>
        </RequireReviewer>
      </MemoryRouter>,
    );

  it.each(["admin", "super_admin"])("lets %s in", (role) => {
    session.signIn({ token: "t", user: { id: 1, role } });
    open();
    expect(screen.getByText("queue")).toBeInTheDocument();
  });

  it("keeps ordinary users out", () => {
    session.signIn({ token: "t", user: { id: 1, role: "firm_admin" } });
    open();
    expect(screen.queryByText("queue")).not.toBeInTheDocument();
    expect(screen.getByText(S.notAllowed)).toBeInTheDocument();
  });
});
