// TODO: Pertahankan penolakan akun nonstaf pada alat administrasi lokal.
import { expect, it, vi } from "vitest";
import {
	validateInput,
	findStaffAccount,
} from "../scripts/auth/reset-staff-password.mjs";
/** Menolak input lemah tanpa membocorkan nilai password ke pesan kesalahan. */
it("memvalidasi input reset", function validateReset() {
	expect(function invalidEmail() {
		validateInput({ email: "invalid", password: "test-password" });
	}).toThrow("Email");
	expect(function shortPassword() {
		validateInput({ email: "staff@example.com", password: "short" });
	}).toThrow("8–1024");
	expect(
		validateInput({ email: " STAFF@example.com ", password: "test-password" })
			.email,
	).toBe("staff@example.com");
});
/** Menyediakan daftar akun dan profil sintetis tanpa akses project nyata. */
function clientFor(profile) {
	return {
		auth: {
			admin: {
				listUsers: vi
					.fn()
					.mockResolvedValue({
						data: {
							users: [
								{
									id: "staff-id",
									email: "staff@example.com",
									email_confirmed_at: "confirmed",
								},
							],
						},
						error: null,
					}),
			},
		},
		from:
			/** Menyusun respons profil yang dilindungi pemeriksaan peran. */
			function from() {
				return {
					select:
						/** Memproyeksikan peran dan status aktif akun. */
						function select() {
							return {
								eq:
									/** Menyelesaikan query profil untuk ID hasil pencarian akun. */
									function eq() {
										return {
											single: vi
												.fn()
												.mockResolvedValue({ data: profile, error: null }),
										};
									},
							};
						},
				};
			},
	};
}
/** Menolak reset akun peserta, nonaktif, atau profil yang tidak tersedia. */
it("menolak akun di luar staf aktif", async function rejectNonStaff() {
	for (const profile of [
		{ role: "participant", is_active: true },
		{ role: "admin", is_active: false },
		null,
	])
		await expect(
			findStaffAccount(clientFor(profile), "staff@example.com"),
		).rejects.toThrow("bukan staf aktif");
});
/** Menemukan akun hanya setelah peran database lolos pemeriksaan. */
it("menerima staf aktif tanpa mengubah data", async function acceptStaff() {
	for (const role of ["admin", "mentor_general"]) {
		const client = clientFor({ role, is_active: true });
		expect(await findStaffAccount(client, "staff@example.com")).toEqual({
			id: "staff-id",
			confirmed: true,
			role,
		});
		expect(client.auth.admin.listUsers).toHaveBeenCalledOnce();
	}
});
