import { describe, expect, it } from "vitest";
import { firebaseConfigured } from "@/lib/firebase";
import { reportError, track, trackScreen } from "@/lib/analytics";
import { pushState } from "@/lib/push";

// The test build has no VITE_FIREBASE_* config, like a build before Firebase is set up.
describe("without a Firebase config", () => {
  it("is off, and every call is a harmless no-op", async () => {
    expect(firebaseConfigured).toBe(false);
    expect(() => {
      track("search", { search_term: "x" });
      trackScreen("/");
      reportError(new Error("boom"));
    }).not.toThrow();
    expect(pushState()).toBe("unsupported");
  });
});
