// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { describe, expect, it } from "vitest";
import {
	isUserRole,
	roleHome,
	canAccessConnectedApp,
} from "../src/lib/auth/roles";

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

/** Memastikan peran demo lama dan akun nonaktif tidak lolos guard produksi. */
it("membatasi peran rilis yang aktif", function activeReleaseRoles() {
	expect(roleHome("mentor_general")).toBe("/mentor");
	expect(
		canAccessConnectedApp({ role: "mentor_general", is_active: true }),
	).toBe(true);
	expect(canAccessConnectedApp({ role: "admin", is_active: false })).toBe(
		false,
	);
	expect(canAccessConnectedApp({ role: "mentor", is_active: true })).toBe(
		false,
	);
	expect(canAccessConnectedApp(null)).toBe(false);
});
