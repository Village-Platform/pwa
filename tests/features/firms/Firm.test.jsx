import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Firm from "@/features/firms/Firm.jsx";
import MyFirms from "@/features/firms/MyFirms.jsx";
import { session } from "@/lib/session";
import { S } from "@/lib/strings";
import { json, testUser } from "../../helpers";

globalThis.IntersectionObserver ??= class {
  observe() {}
  disconnect() {}
};

const REJECTED = {
  id: 9,
  name: "ورشة الأمل",
  status: "suspended",
  rejection_reason: "رقم الهاتف غير صحيح",
  owner_id: 1,
  category: { id: 2, name: "حرف", icon: null, icon_url: null },
  can: { update: true, destroy: true, moderate: false, review: false },
};

beforeEach(() => {
  session.signIn({ token: "t", user: testUser({ id: 1 }) });
  vi.restoreAllMocks();
});

describe("rejected firms", () => {
  it("shows 'rejected' and the reason on the firm page", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => json(200, { data: REJECTED }));
    render(
      <MemoryRouter initialEntries={["/firms/9"]}>
        <Routes>
          <Route path="/firms/:id" element={<Firm />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText(S.firmStatusRejected)).toBeInTheDocument();
    expect(screen.getByText("رقم الهاتف غير صحيح")).toBeInTheDocument();
  });

  it("lists the reason under the firm in My firms", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      json(200, { data: [REJECTED], meta: { total: 1, total_pages: 1 } }),
    );
    render(
      <MemoryRouter>
        <MyFirms />
      </MemoryRouter>,
    );
    expect(await screen.findByText("رقم الهاتف غير صحيح")).toBeInTheDocument();
    expect(screen.getByText(S.firmStatusRejected)).toBeInTheDocument();
  });

  it("still says 'suspended' when there is no reason", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      json(200, { data: { ...REJECTED, rejection_reason: null } }),
    );
    render(
      <MemoryRouter initialEntries={["/firms/9"]}>
        <Routes>
          <Route path="/firms/:id" element={<Firm />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText(S.firmStatus.suspended)).toBeInTheDocument();
  });
});
