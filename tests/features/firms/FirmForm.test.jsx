import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import FirmForm from "@/features/firms/FirmForm.jsx";
import { __setFeaturesForTest } from "@/lib/features";
import { session } from "@/lib/session";
import { S } from "@/lib/strings";

const json = (status, body) => new Response(JSON.stringify(body), { status });
const CATEGORIES = { data: [{ id: 7, name: "صيدليات" }], meta: {} };

function mockApi(createResponse) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path.endsWith("/auth/guest")) return json(201, { data: { token: "g" } });
    if (path.endsWith("/categories")) return json(200, CATEGORIES);
    if (path.endsWith("/firms") && init.method === "POST") return createResponse;
    throw new Error(`unexpected ${init.method} ${path}`);
  });
}

const open = () =>
  render(
    <MemoryRouter initialEntries={["/firms/new"]}>
      <Routes>
        <Route path="/firms/new" element={<FirmForm />} />
        <Route path="/firms/:id" element={<p>firm page</p>} />
        <Route path="/plans" element={<p>plans page</p>} />
      </Routes>
    </MemoryRouter>,
  );

async function fillAndSave() {
  fireEvent.change(await screen.findByLabelText(new RegExp(S.firmName)), { target: { value: "صيدلية النور" } });
  fireEvent.click(await screen.findByRole("button", { name: "صيدليات" }));
  fireEvent.click(screen.getByRole("button", { name: S.save }));
}

describe("FirmForm", () => {
  beforeEach(() => {
    session.signIn({ token: "t", user: { id: 1, role: "firm_admin" } });
    __setFeaturesForTest({ plans: true });
    vi.restoreAllMocks();
  });

  it("requires a name and a category before calling the server", async () => {
    const fetchMock = mockApi(json(201, {}));
    open();
    fireEvent.click(await screen.findByRole("button", { name: S.save }));
    expect(screen.getByText(S.errorRequired)).toBeInTheDocument();
    expect(screen.getByText(S.errorCategoryRequired)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, i]) => i?.method === "POST")).toBe(false);
  });

  it("creates the firm and opens its page", async () => {
    const fetchMock = mockApi(json(201, { data: { id: 42, status: "active" } }));
    open();
    await fillAndSave();
    expect(await screen.findByText("firm page")).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([, i]) => i?.method === "POST");
    expect(JSON.parse(post[1].body).firm).toMatchObject({ name: "صيدلية النور", category_id: 7, phone: null });
  });

  it("offers the plans screen when a subscription is required", async () => {
    mockApi(json(403, { error: { code: "subscription_required", message: "اشترك للإضافة" } }));
    open();
    await fillAndSave();
    expect(await screen.findByText("اشترك للإضافة")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: S.viewPlans }));
    expect(await screen.findByText("plans page")).toBeInTheDocument();
  });

  it("hides that action while the plans feature is off", async () => {
    __setFeaturesForTest({ plans: false });
    mockApi(json(403, { error: { code: "subscription_required", message: "اشترك للإضافة" } }));
    open();
    await fillAndSave();
    await screen.findByText("اشترك للإضافة");
    expect(screen.queryByRole("link", { name: S.viewPlans })).not.toBeInTheDocument();
  });

  it("shows server validation errors next to the field", async () => {
    mockApi(json(422, { error: { code: "validation_failed", message: "x", details: { name: ["الاسم مستخدم"] } } }));
    open();
    await fillAndSave();
    await waitFor(() =>
      expect(screen.getByLabelText(new RegExp(S.firmName))).toHaveAccessibleDescription("الاسم مستخدم"),
    );
  });
});
