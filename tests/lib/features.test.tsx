import { afterEach, describe, expect, it } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { __setFeaturesForTest, useFlag } from "@/lib/features";
import FeatureGate from "@/components/FeatureGate.jsx";

afterEach(() => act(() => __setFeaturesForTest(null)));

describe("useFlag", () => {
  it("is null while nothing is known", () => {
    __setFeaturesForTest(null);
    expect(renderHook(() => useFlag("plans")).result.current).toBeNull();
  });

  it("reads any key and treats a missing one as off", () => {
    __setFeaturesForTest({ plans: true, webPush: false });
    expect(renderHook(() => useFlag("plans")).result.current).toBe(true);
    expect(renderHook(() => useFlag("webPush")).result.current).toBe(false);
    expect(renderHook(() => useFlag("unknown")).result.current).toBe(false);
  });

  it("only accepts a literal true", () => {
    __setFeaturesForTest({ plans: "yes" });
    expect(renderHook(() => useFlag("plans")).result.current).toBe(false);
  });
});

describe("FeatureGate", () => {
  const gate = () =>
    render(
      <MemoryRouter>
        <FeatureGate flag="plans">
          <p>plans screen</p>
        </FeatureGate>
      </MemoryRouter>,
    );

  it("shows the screen while the flag is unknown", () => {
    __setFeaturesForTest(null);
    gate();
    expect(screen.getByText("plans screen")).toBeInTheDocument();
  });

  it("shows the screen when the flag is on", () => {
    __setFeaturesForTest({ plans: true });
    gate();
    expect(screen.getByText("plans screen")).toBeInTheDocument();
  });

  it("hides the screen once the flag is known to be off", () => {
    __setFeaturesForTest({ plans: false });
    gate();
    expect(screen.queryByText("plans screen")).not.toBeInTheDocument();
  });
});
