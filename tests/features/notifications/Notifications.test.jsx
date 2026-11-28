import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Notifications from "@/features/notifications/Notifications.jsx";
import ToastHost from "@/components/Toast.jsx";
import { session } from "@/lib/session";
import { S } from "@/lib/strings";
import { json, testUser } from "../../helpers";

globalThis.IntersectionObserver ??= class {
  observe() {}
  disconnect() {}
};

const ROW = (id, read = false) => ({
  id,
  kind: "broadcast",
  title: `إشعار ${id}`,
  body: "",
  data: { screen: "none" },
  read,
  read_at: null,
  created_at: new Date().toISOString(),
});

function mockServer({ readFails = false } = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init = {}) => {
    if (init.method === "PATCH") {
      return readFails ? json(500, { error: { code: "x", message: "x" } }) : new Response(null, { status: 204 });
    }
    // One page loaded, but the server knows of 12 unread in the whole inbox.
    return json(200, { data: [ROW(1), ROW(2, true)], meta: { total_pages: 3, unread_count: 12 } });
  });
}

const open = () =>
  render(
    <MemoryRouter>
      <Notifications />
      <ToastHost />
    </MemoryRouter>,
  );

beforeEach(() => {
  session.signIn({ token: "t", user: testUser() });
  vi.restoreAllMocks();
});

describe("Notifications", () => {
  it("shows the server's unread count, minus rows read here", async () => {
    mockServer();
    open();
    expect(await screen.findByText(S.unreadCount(12))).toBeInTheDocument();
    fireEvent.click(screen.getByText("إشعار 1"));
    expect(await screen.findByText(S.unreadCount(11))).toBeInTheDocument();
  });

  it("puts the row back to unread and says so when marking it read fails", async () => {
    mockServer({ readFails: true });
    open();
    fireEvent.click(await screen.findByText("إشعار 1"));
    expect(await screen.findByText(S.markReadFailed)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(S.unreadCount(12))).toBeInTheDocument());
  });
});
