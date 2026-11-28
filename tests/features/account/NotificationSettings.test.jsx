import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ToastHost from "@/components/Toast.jsx";
import { S } from "@/lib/strings";
import NotificationSettings from "@/features/account/NotificationSettings.jsx";
import { session } from "@/lib/session";

const json = (status, body) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  session.clear();
  session.setGuestToken("g");
  vi.restoreAllMocks();
});

function mockServer({ failToggle = false } = {}) {
  let subscribed = false;
  const calls = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path.endsWith("/topics")) return json(200, { data: [{ key: "news", name: "الأخبار", subscribed }] });
    calls.push(`${init.method} ${path.split("/").slice(-3).join("/")}`);
    if (failToggle) return json(429, { error: { code: "rate_limited", message: "حاول لاحقاً" } });
    subscribed = init.method === "PUT";
    return json(200, { data: {} });
  });
  return calls;
}

const open = () =>
  render(
    <MemoryRouter>
      <NotificationSettings />
      <ToastHost />
    </MemoryRouter>,
  );

describe("NotificationSettings", () => {
  it("opts in when switched on, and shows the server's state afterwards", async () => {
    const calls = mockServer();
    open();
    const toggle = await screen.findByRole("switch", { name: "الأخبار" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true"); // immediately
    await waitFor(() => expect(calls).toEqual([expect.stringMatching(/^PUT .*\/topics\/news$/)]));
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: "الأخبار" })).toHaveAttribute("aria-checked", "true"),
    );
  });

  it("goes back to the server's state when saving fails", async () => {
    mockServer({ failToggle: true });
    open();
    const toggle = await screen.findByRole("switch", { name: "الأخبار" });
    fireEvent.click(toggle);
    expect(await screen.findByText("حاول لاحقاً")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: "الأخبار" })).toHaveAttribute("aria-checked", "false"),
    );
  });

  it("hides the push section until the server turns web push on", async () => {
    mockServer();
    open();
    await screen.findByRole("switch", { name: "الأخبار" });
    expect(screen.queryByText(S.pushTitle)).not.toBeInTheDocument();
  });
});
