// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { describe, expect, it } from "vitest";
import { isUserRole, roleHome } from "../src/lib/auth/roles";

describe("role routing" /** Memproses elemen atau peristiwa lokal untuk operasi yang sedang dijalankan. */, () => {
	it("rejects unexpected database roles instead of silently granting access" /** Memproses elemen atau peristiwa lokal untuk operasi yang sedang dijalankan. */, () => {
		for (const role of [null, undefined, "owner", "superadmin", ""]) {
			expect(isUserRole(role)).toBe(false);
		}
	});

	it("routes each known role to its own area" /** Memproses elemen atau peristiwa lokal untuk operasi yang sedang dijalankan. */, () => {
		expect(roleHome("participant")).toBe("/peserta");
		expect(roleHome("mentor")).toBe("/mentor");
		expect(roleHome("admin")).toBe("/admin");
	});
});
