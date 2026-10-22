// TODO: Lengkapi bukti OAuth nyata melalui browser tanpa mencatat token pengguna.
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(
	/** Menyediakan adapter sesi terkontrol untuk menguji callback tanpa jaringan. */
	function createMocks() {
		return { exchange: vi.fn() };
	},
);
vi.mock(
	"@/lib/supabase/server",
	/** Mengganti layanan eksternal dengan penukar kode yang dapat diperiksa. */
	function mockSupabase() {
		return {
			createClient: vi.fn(
				/** Membuat client palsu tanpa menyimpan sesi pengguna nyata. */
				async function mockClient() {
					return { auth: { exchangeCodeForSession: mocks.exchange } };
				},
			),
		};
	},
);
import { GET } from "../src/app/auth/callback/route";
/** Membersihkan konfigurasi dan hasil mock setiap pengujian. */
afterEach(function restoreMocks() {
	vi.unstubAllEnvs();
	vi.clearAllMocks();
});
/** Menyetel origin yang dikenal untuk semua skenario callback. */
function configure() {
	vi.stubEnv("APP_URL", "http://localhost:3000");
	vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
	vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_contoh");
}
/** Memeriksa redirect dan kegagalan callback dengan cookie exchange terisolasi. */
describe("callback OAuth", function callbackScenarios() {
	/** Menolak tujuan next eksternal dan hanya menggunakan dashboard origin aplikasi. */
	it("mengabaikan redirect eksternal", async function ignoreExternalDestination() {
		configure();
		mocks.exchange.mockResolvedValue({ error: null });
		const response = await GET(
			new NextRequest(
				"http://localhost:3000/auth/callback?code=test&next=https://evil.example",
			),
		);
		expect(response.headers.get("location")).toBe(
			"http://localhost:3000/dashboard",
		);
		expect(mocks.exchange).toHaveBeenCalledWith("test");
	});
	/** Mengembalikan kegagalan yang aman untuk kode salah maupun login dibatalkan. */
	it("menangani kode invalid dan pembatalan", async function rejectInvalidCode() {
		configure();
		mocks.exchange.mockResolvedValue({ error: { message: "invalid" } });
		for (const query of ["?code=invalid", "?error=access_denied"]) {
			const response = await GET(
				new NextRequest(`http://localhost:3000/auth/callback${query}`),
			);
			expect(response.headers.get("location")).toBe(
				"http://localhost:3000/?auth=failed",
			);
		}
	});
});
