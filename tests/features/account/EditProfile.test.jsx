import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EditProfile from "@/features/account/EditProfile.jsx";
import { session } from "@/lib/session";
import { S } from "@/lib/strings";

const json = (status, body) => new Response(JSON.stringify(body), { status });
const USER = { id: 1, name: "Ali", phone: "01012345678", email: "a@x.com" };

beforeEach(() => {
  session.signIn({ token: "t", user: USER });
  vi.restoreAllMocks();
});

const open = () =>
  render(
    <MemoryRouter>
      <EditProfile />
    </MemoryRouter>,
  );
const field = (label) => screen.getByLabelText(label, { exact: false });
const save = () => fireEvent.click(screen.getByRole("button", { name: S.save }));

describe("EditProfile", () => {
  it("saves a name change without asking for the password, and updates the session", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(200, { data: { ...USER, name: "Omar" } }));
    open();
    expect(screen.queryByLabelText(S.currentPassword)).not.toBeInTheDocument();
    fireEvent.change(field(S.name), { target: { value: "Omar" } });
    save();
    await waitFor(() => expect(session.get().user.name).toBe("Omar"));
    expect(JSON.parse(spy.mock.calls.at(-1)[1].body).user).toEqual({
      name: "Omar",
      phone: "01012345678",
      email: "a@x.com",
    });
  });

  it("asks for the current password when the phone changes, and sends it", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(200, { data: { ...USER, phone: "01099999999" } }));
    open();
    fireEvent.change(field(S.phoneNumber), { target: { value: "01099999999" } });
    save();
    expect(screen.getByText(S.errorPasswordRequired)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(S.currentPassword, { exact: false }), { target: { value: "secret123" } });
    save();
    await waitFor(() => expect(session.get().user.phone).toBe("01099999999"));
    expect(JSON.parse(spy.mock.calls.at(-1)[1].body).user.current_password).toBe("secret123");
  });

  it("clears the email when it is emptied", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(200, { data: { ...USER, email: null } }));
    open();
    fireEvent.change(field(S.emailOptional), { target: { value: "" } });
    save();
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(JSON.parse(spy.mock.calls.at(-1)[1].body).user.email).toBeNull();
  });

  it("shows the server's message when the phone is taken", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      json(422, { error: { code: "phone_taken", message: "الرقم مستخدم" } }),
    );
    open();
    fireEvent.change(field(S.name), { target: { value: "Omar" } });
    save();
    expect(await screen.findByText("الرقم مستخدم")).toBeInTheDocument();
    expect(session.get().user.name).toBe("Ali");
  });
});
