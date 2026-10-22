// TODO: Lengkapi bukti OAuth nyata melalui browser tanpa mencatat token pengguna.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(
	/** Menyediakan adapter sesi terkontrol untuk menguji callback tanpa jaringan. */
	function createMocks() {
		return { exchange: vi.fn(), oauth: vi.fn() };
	},
);
vi.mock(
	"server-only",
	/** Mengisolasi modul khusus server pada runner Node. */
	function mockServerOnly() {
		return {};
	},
);
/** Menyimpan diagnostik statis tanpa mengotori output pengujian. */
beforeEach(function captureDiagnostics() {
	vi.spyOn(console, "error").mockImplementation(
		/** Tidak menuliskan diagnostik kasus gagal yang memang sedang diuji. */
		function quietError() {},
	);
});
vi.mock(
	"@/lib/supabase/server",
	/** Mengganti layanan eksternal dengan penukar kode yang dapat diperiksa. */
	function mockSupabase() {
		return {
			createClient: vi.fn(
				/** Membuat client palsu tanpa menyimpan sesi pengguna nyata. */
				async function mockClient() {
					return {
						auth: {
							exchangeCodeForSession: mocks.exchange,
							signInWithOAuth: mocks.oauth,
						},
					};
				},
			),
		};
	},
);
import { beginGoogleLogin } from "../src/controllers/auth/google-login";
import { GET } from "../src/app/auth/callback/route";
/** Membersihkan konfigurasi dan hasil mock setiap pengujian. */
afterEach(function restoreMocks() {
	vi.unstubAllEnvs();
	vi.clearAllMocks();
	vi.restoreAllMocks();
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

/** Menguji regresi callback deployment tanpa APP_URL atau dengan URL invalid. */
it("mengalihkan konfigurasi origin salah tanpa HTTP 500", async function invalidAppOrigin() {
	for (const value of [undefined, "invalid-url", "https://example.com/path"]) {
		configure();
		vi.stubEnv("APP_URL", value);
		const response = await GET(
			new NextRequest("https://deployment.example.com/auth/callback"),
		);
		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe(
			"https://deployment.example.com/?auth=google-config",
		);
	}
	expect(mocks.exchange).not.toHaveBeenCalled();
});
/** Mengubah exception penukaran kode menjadi hasil login gagal yang aman. */
it("menangani exception callback tanpa membocorkan kode", async function callbackNetworkFailure() {
	configure();
	mocks.exchange.mockRejectedValue(new Error("sensitive-provider-detail"));
	const response = await GET(
		new NextRequest("http://localhost:3000/auth/callback?code=test-code"),
	);
	expect(response.headers.get("location")).toBe(
		"http://localhost:3000/?auth=failed",
	);
	expect(console.error).toHaveBeenCalledWith("[auth] google_callback_failed");
});
/** Tidak memulai komunikasi OAuth jika origin deployment belum dikonfigurasi. */
it("menolak login Google yang belum dikonfigurasi", async function rejectUnconfiguredStart() {
	configure();
	vi.stubEnv("APP_URL", undefined);
	expect(await beginGoogleLogin()).toBe("/?auth=google-config");
	expect(mocks.oauth).not.toHaveBeenCalled();
});
/** Menangani exception provider saat pengguna menekan tombol login. */
it("menangani kegagalan mulai OAuth", async function oauthStartFailure() {
	configure();
	mocks.oauth.mockRejectedValue(new Error("sensitive-provider-detail"));
	expect(await beginGoogleLogin()).toBe("/?auth=failed");
	expect(console.error).toHaveBeenCalledWith("[auth] google_start_failed");
});
/** Memastikan callback dibangun dari origin konfigurasi yang valid dan tetap mempertahankan PKCE SDK. */
it("menggunakan callback domain aplikasi", async function correctCallbackOrigin() {
	configure();
	vi.stubEnv("APP_URL", "https://deployment.example.com");
	mocks.oauth.mockResolvedValue({
		data: { url: "https://example.supabase.co/auth/v1/authorize" },
		error: null,
	});
	expect(await beginGoogleLogin()).toBe(
		"https://example.supabase.co/auth/v1/authorize",
	);
	expect(mocks.oauth).toHaveBeenCalledWith({
		provider: "google",
		options: {
			redirectTo: "https://deployment.example.com/auth/callback",
			scopes: "openid email profile",
		},
	});
});
