import { describe, expect, it } from "vitest";
import { isUserRole, roleHome } from "../src/lib/auth/roles";

describe("role routing", () => {
  it("rejects unexpected database roles instead of silently granting access", () => {
    for (const role of [null, undefined, "owner", "superadmin", ""]) {
      expect(isUserRole(role)).toBe(false);
    }
  });

  it("routes each known role to its own area", () => {
    expect(roleHome("participant")).toBe("/peserta");
    expect(roleHome("mentor")).toBe("/mentor");
    expect(roleHome("admin")).toBe("/admin");
  });
});
