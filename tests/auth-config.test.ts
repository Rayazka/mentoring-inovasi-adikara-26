// TODO: Tambahkan skenario konfigurasi ketika dukungan Supabase lokal dibutuhkan.
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppUrl, hasSupabaseConfig } from "../src/lib/supabase/env";
/** Menghapus perubahan environment agar pengujian tidak saling memengaruhi. */
afterEach(function restoreEnvironment() {
	vi.unstubAllEnvs();
});
/** Menguji penolakan konfigurasi yang dapat membocorkan kredensial atau redirect. */
describe("konfigurasi autentikasi", function authenticationConfiguration() {
	/** Memastikan secret tidak diterima sebagai key browser. */
	it("menolak secret key dan endpoint REST", function rejectUnsafeConfiguration() {
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_contoh");
		expect(hasSupabaseConfig()).toBe(false);
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_contoh");
		expect(hasSupabaseConfig()).toBe(true);
		vi.stubEnv(
			"NEXT_PUBLIC_SUPABASE_URL",
			"https://example.supabase.co/rest/v1/",
		);
		expect(hasSupabaseConfig()).toBe(false);
	});
	/** Menjaga safeParse tetap mengembalikan false ketika URL deployment tidak dapat diparse. */
	it("menolak URL invalid tanpa exception server", function malformedProjectUrl() {
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_contoh");
		for (const value of ["", "invalid-url", "/rest/v1/"]) {
			vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", value);
			expect(hasSupabaseConfig()).toBe(false);
		}
	});
	/** Memastikan callback hanya dibangun dari origin deployment yang dikonfigurasi. */
	it("membatasi origin aplikasi", function restrictApplicationOrigin() {
		for (const value of [
			"https://example.com/path",
			"javascript:alert(1)",
			"http://example.com",
			"https://example.com?redirect=evil",
			"https://user:password@example.com",
		]) {
			vi.stubEnv("APP_URL", value);
			expect(getAppUrl).toThrow();
		}
		vi.stubEnv("APP_URL", "http://localhost:3000");
		expect(getAppUrl()).toBe("http://localhost:3000");
		vi.stubEnv("APP_URL", "https://example.vercel.app");
		expect(getAppUrl()).toBe("https://example.vercel.app");
	});
});
