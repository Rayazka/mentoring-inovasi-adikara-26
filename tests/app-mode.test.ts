// TODO: Pertahankan pengujian agar environment hilang atau salah tidak mengaktifkan fixtures pada deployment.
import { afterEach, expect, it, vi } from "vitest";
import { isDemoMode } from "../src/models/demo/mode";

/** Mengembalikan environment setelah setiap pengujian mode aplikasi. */
afterEach(function restoreEnvironment() {
	vi.unstubAllEnvs();
});

/** Mencegah environment yang hilang atau salah diketik berubah menjadi demo. */
it("tidak memakai demo sebagai fallback deployment", function connectedFallback() {
	for (const value of [undefined, "", "connected", "conected"]) {
		vi.stubEnv("NEXT_PUBLIC_APP_MODE", value);
		expect(isDemoMode()).toBe(false);
	}
});

/** Mempertahankan demo lokal sebagai pilihan eksplisit yang terpisah. */
it("mengaktifkan demo hanya dengan nilai demo", function explicitDemo() {
	vi.stubEnv("NEXT_PUBLIC_APP_MODE", "demo");
		expect(isDemoMode()).toBe(true);
});
