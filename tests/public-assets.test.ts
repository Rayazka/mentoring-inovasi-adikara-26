// TODO: Periksa manifest ketika menambah aset agar source privat tidak ikut terpublikasi.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { publicAssets } from "../src/models/public-assets";
/** Memastikan seluruh aset manifest tersedia sebagai berkas statis pada build production. */
it("menyediakan seluruh aset resmi pada public", function publicManifest() {
	for (const path of Object.values(publicAssets)) {
		expect(path.startsWith("/")).toBe(true);
		expect(existsSync(join(process.cwd(), "public", path))).toBe(true);
	}
});
/** Menolak dependensi endpoint development pada stylesheet yang dipakai production. */
it("menggunakan URL statis pada stylesheet", function staticStyles() {
	for (const file of ["login.css", "reference.css"]) {
		const css = readFileSync(
			join(process.cwd(), "src/views/styles", file),
			"utf8",
		);
		expect(css).not.toContain("/api/demo-assets/");
		for (const match of css.matchAll(/url\("(\/[^"?]+)"\)/g)) {
			expect(existsSync(join(process.cwd(), "public", match[1]))).toBe(true);
		}
	}
});
/** Memastikan katalog publik hanya membawa profil dan aset yang tersedia tanpa kontak. */
it("membatasi isi katalog mentor publik", function sanitizedCatalog() {
	const catalog = JSON.parse(
		readFileSync(join(process.cwd(), "public/mentors/catalog.json"), "utf8"),
	);
	for (const mentor of catalog) {
		expect(Object.keys(mentor).sort()).toEqual(
			[
				"achievements",
				"availability_note",
				"expertise",
				"name",
				"photo_url",
			].sort(),
		);
		if (mentor.photo_url)
			expect(existsSync(join(process.cwd(), "public", mentor.photo_url))).toBe(
				true,
			);
	}
});
