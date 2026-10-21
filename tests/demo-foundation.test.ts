// TODO: Add integration coverage when the demo repository is replaced with server-backed persistence.
import { describe, expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import { requireAdmin, safeUrl } from "../src/controllers/demo/context";

/** Verify fixture boundaries and basic authorization without using production identities. */
describe("MVC demo foundation", function demoFoundationSuite() {
  /** Verify session and buffer generation remains faithful to the configured event window. */
  it("generates fictional mentors and complete slots without a session at 21:50", function completeDemoSlots() {
    const seed = createDemoSeed();
    expect(seed.mentors).toHaveLength(9);
    expect(seed.slots).toHaveLength(170);
    expect(seed.slots.some(function partialSlot(slot) { return slot.start === "21:50"; })).toBe(false);
    expect(seed.userId).toBeNull();
  });
  /** Ensure a participant cannot invoke administrator commands in the demo controller. */
  it("rejects unauthorized admin actions", function adminBoundary() {
    const state = createDemoSeed(); state.userId = "alya";
    /** Exercise the unauthorized command under the assertion. */
    expect(function rejectedAdmin() { return requireAdmin(state); }).toThrow();
  });
  /** Ensure user-provided links cannot contain executable URL schemes. */
  it("rejects unsafe links", function unsafeLinkBoundary() {
    /** Exercise unsafe input under the assertion. */
    expect(function rejectedUrl() { return safeUrl("javascript:alert(1)"); }).toThrow();
    expect(safeUrl("https://example.com")).toBe("https://example.com/");
  });
});
