// TODO: Jaga dokumentasi, pemisahan tanggung jawab dan pengujian modul ini saat perilakunya berubah.
import { describe, expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import { sessionCommand } from "../src/controllers/demo/session-controller";

/** Menguji bahwa login lokal menolak akun yang tidak dikenal atau diarsipkan. */
describe("demo sessions" /** Menjalankan langkah sessionSuite sesuai tanggung jawab modul ini. */, function sessionSuite() {
	/** Menguji masuk dan keluar menggunakan data fiktif. */
	it("logs in and out without an external provider" /** Menjalankan langkah localLogin sesuai tanggung jawab modul ini. */, function localLogin() {
		const state = createDemoSeed();
		sessionCommand(state, "session.login", { userId: "alya" });
		expect(state.userId).toBe("alya");
		sessionCommand(state, "session.logout", {});
		expect(state.userId).toBeNull();
	});
	/** Menguji bahwa mentor nonaktif tidak mendapat akses melalui pilihan akun. */
	it("rejects a disabled mentor" /** Menjalankan langkah disabledMentor sesuai tanggung jawab modul ini. */, function disabledMentor() {
		const state = createDemoSeed();
		state.mentors[0].active = false;
		/** Memastikan identitas nonaktif tidak dapat masuk. */
		expect(
			/** Menjalankan langkah deniedLogin sesuai tanggung jawab modul ini. */
			function deniedLogin() {
				sessionCommand(state, "session.login", { userId: "user-mentor-1" });
			},
		).toThrow();
	});
});
