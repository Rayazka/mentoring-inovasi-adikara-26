// TODO: Pertahankan isolasi menu dan nama peran saat halaman staf bertambah.
import { expect, it } from "vitest";
import {
	staffDisplayName,
	staffNavigation,
} from "../src/models/connected/staff";
/** Menghindari label peserta generik pada akun staf tanpa menimpa nama yang sah. */
it("menampilkan identitas staf sesuai profil", function identity() {
	expect(
		staffDisplayName({ full_name: "Peserta ADIKARA", role: "admin" }),
	).toBe("Admin ADIKARA");
	expect(staffDisplayName({ full_name: null, role: "mentor_general" })).toBe(
		"Mentor ADIKARA",
	);
	expect(staffDisplayName({ full_name: "Panitia", role: "admin" })).toBe(
		"Panitia",
	);
});
/** Memastikan menu mentor tidak mengarah ke ruang administrasi. */
it("memisahkan navigasi ruang staf", function navigation() {
	for (const item of staffNavigation("mentor_general"))
		expect(item.href.startsWith("/mentor")).toBe(true);
	for (const item of staffNavigation("admin"))
		expect(item.href.startsWith("/admin")).toBe(true);
});
