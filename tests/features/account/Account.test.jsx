import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Account from "@/features/account/Account.jsx";
import { __setFeaturesForTest } from "@/lib/features";
import { session } from "@/lib/session";
import { S } from "@/lib/strings";
import { json, testUser } from "../../helpers";

const USER = testUser({ role: "firm_admin" });

function mockServer({ firmsFail = false } = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    const u = new URL(url);
    if (u.pathname.endsWith("/me")) return json(200, { data: USER });
    if (u.pathname.endsWith("/firms")) {
      return firmsFail
        ? json(500, { error: { code: "server_error", message: "تعذّر التحميل" } })
        : json(200, { data: [{ id: 1, name: "صيدلية النور" }], meta: { total: 7 } });
    }
    if (u.pathname.endsWith("/subscriptions")) {
      return json(200, {
        data: [{ id: 3, status: "active", state: "current", days_left: 10, plan: { name: "شهري", duration_days: 30 } }],
      });
    }
    throw new Error(`unexpected ${u.pathname}`);
  });
}

const open = () =>
  render(
    <MemoryRouter>
      <Account />
    </MemoryRouter>,
  );

describe("Account profile", () => {
  beforeEach(() => {
    session.signIn({ token: "t", user: USER });
    __setFeaturesForTest({ plans: true });
    vi.restoreAllMocks();
  });

  it("counts firms with the server's total and shows the current plan", async () => {
    mockServer();
    open();
    expect(await screen.findByText("7")).toBeInTheDocument();
    expect(screen.getByText("صيدلية النور")).toBeInTheDocument();
    expect(screen.queryByText(S.subscribeNow)).not.toBeInTheDocument();
  });

  it("shows a retry, not zero firms and a subscribe prompt, when loading fails", async () => {
    const spy = mockServer({ firmsFail: true });
    open();
    expect(await screen.findByText("تعذّر التحميل")).toBeInTheDocument();
    expect(screen.queryByText(S.subscribeNow)).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    spy.mockRestore();
    mockServer();
    fireEvent.click(screen.getByRole("button", { name: S.retry }));
    expect(await screen.findByText("7")).toBeInTheDocument();
  });
});
