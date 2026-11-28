import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AlertBox, Dialog, FilterChipsRow, FormField, Segmented } from "@/components/ui.jsx";

const inRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("Dialog", () => {
  const open = (props = {}) =>
    inRouter(<Dialog title="حذف؟" body="متأكد" confirm="حذف" onConfirm={vi.fn()} onCancel={vi.fn()} {...props} />);

  it("is a labelled modal dialog", () => {
    open();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("حذف؟");
  });

  it("moves focus inside and closes on Escape", () => {
    const onCancel = vi.fn();
    open({ onCancel });
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("keeps Tab inside the dialog", () => {
    open();
    const buttons = screen.getAllByRole("button");
    buttons[buttons.length - 1].focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(buttons[0]);
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it("returns focus to the opener when it closes", () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const { unmount } = open();
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});

describe("AlertBox", () => {
  it("closes on Escape too", () => {
    const onClose = vi.fn();
    inRouter(<AlertBox title="تم" onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});

describe("FormField", () => {
  it("links the error to the input", () => {
    inRouter(<FormField label="الاسم" error="مطلوب" />);
    const input = screen.getByLabelText(/الاسم/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("مطلوب");
  });

  it("has no invalid state without an error", () => {
    inRouter(<FormField label="الاسم" />);
    expect(screen.getByLabelText(/الاسم/)).not.toHaveAttribute("aria-invalid");
  });
});

describe("toggle buttons", () => {
  it("FilterChipsRow marks the selected chip as pressed", () => {
    const items = [
      { value: 1, label: "أ" },
      { value: 2, label: "ب" },
    ];
    inRouter(<FilterChipsRow items={items} selected={2} onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: "أ" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "ب" })).toHaveAttribute("aria-pressed", "true");
  });

  it("Segmented marks the selected option as pressed", () => {
    inRouter(
      <Segmented
        options={[
          { value: "a", label: "أ" },
          { value: "b", label: "ب" },
        ]}
        selected="a"
        onSelect={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "أ" })).toHaveAttribute("aria-pressed", "true");
  });
});
