// TODO: Jaga dokumentasi, pemisahan tanggung jawab dan pengujian modul ini saat perilakunya berubah.
import { describe, expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import { requireAdmin, safeUrl } from "../src/controllers/demo/context";

/** Menguji batas data contoh dan otorisasi dasar tanpa identitas produksi. */
describe("MVC demo foundation" /** Menjalankan langkah demoFoundationSuite sesuai tanggung jawab modul ini. */, function demoFoundationSuite() {
	/** Menguji bahwa sesi dan jeda tetap berada dalam rentang kegiatan. */
	it("generates fictional mentors and complete slots without a session at 21:50" /** Menjalankan langkah completeDemoSlots sesuai tanggung jawab modul ini. */, function completeDemoSlots() {
		const seed = createDemoSeed();
		expect(seed.mentors).toHaveLength(9);
		expect(seed.slots).toHaveLength(170);
		expect(
			seed.slots.some(
				/** Menjalankan langkah partialSlot sesuai tanggung jawab modul ini. */
				function partialSlot(slot) {
					return slot.start === "21:50";
				},
			),
		).toBe(false);
		expect(seed.userId).toBeNull();
	});
	/** Menguji bahwa peserta tidak dapat menjalankan tindakan administrator. */
	it("rejects unauthorized admin actions" /** Menjalankan langkah adminBoundary sesuai tanggung jawab modul ini. */, function adminBoundary() {
		const state = createDemoSeed();
		state.userId = "alya";
		/** Menjalankan tindakan tanpa izin untuk memeriksa penolakannya. */
		expect(
			/** Menjalankan langkah rejectedAdmin sesuai tanggung jawab modul ini. */
			function rejectedAdmin() {
				return requireAdmin(state);
			},
		).toThrow();
	});
	/** Menguji bahwa tautan pengguna tidak dapat menjalankan kode. */
	it("rejects unsafe links" /** Menjalankan langkah unsafeLinkBoundary sesuai tanggung jawab modul ini. */, function unsafeLinkBoundary() {
		/** Menjalankan masukan tidak aman untuk memeriksa penolakannya. */
		expect(
			/** Menjalankan langkah rejectedUrl sesuai tanggung jawab modul ini. */
			function rejectedUrl() {
				return safeUrl("javascript:alert(1)");
			},
		).toThrow();
		expect(safeUrl("https://example.com")).toBe("https://example.com/");
	});
});
