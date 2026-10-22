// TODO: Perluas skenario sesi saat kebijakan akses peran rilis berubah.
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Menyiapkan profil dan identitas yang dapat berubah antar permintaan. */
	function setupMocks() {
		return { user: vi.fn(), profile: vi.fn() };
	},
);
vi.mock(
	"server-only",
	/** Mengisolasi pembatas server pada runner pengujian Node. */
	function mockServer() {
		return {};
	},
);
vi.mock(
	"next/navigation",
	/** Menjadikan redirect dapat diuji tanpa menjalankan router Next.js. */
	function mockNavigation() {
		return {
			redirect:
				/** Menghentikan eksekusi seperti redirect server sesungguhnya. */
				function redirect(path: string): never {
					throw new Error(`REDIRECT:${path}`);
				},
		};
	},
);
vi.mock(
	"@/lib/supabase/server",
	/** Mengganti query profil dan sesi dengan adapter tanpa jaringan. */
	function mockSupabase() {
		return {
			createClient:
				/** Mengembalikan client palsu untuk pemeriksaan guard. */
				async function client() {
					return {
						auth: { getUser: mocks.user },
						from:
							/** Memilih profil yang dilindungi RLS. */
							function from() {
								return {
									select:
										/** Memilih kolom profil termasuk status aktif. */
										function select() {
											return {
												eq:
													/** Menyelesaikan query profil pemilik sesi. */
													function eq() {
														return { single: mocks.profile };
													},
											};
										},
								};
							},
					};
				},
		};
	},
);
import { requireSession } from "../src/lib/auth/session";
/** Menghapus environment dan respons mock antar pengujian. */
afterEach(function clean() {
	vi.unstubAllEnvs();
	vi.clearAllMocks();
});
/** Menyiapkan konfigurasi valid dan metadata browser palsu. */
function configure() {
	vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
	vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_contoh");
	mocks.user.mockResolvedValue({
		data: { user: { id: "user", user_metadata: { role: "admin" } } },
		error: null,
	});
}
/** Memeriksa otorisasi tetap bergantung pada profil terbaru di database. */
describe("guard server", function sessionGuard() {
	/** Menolak pengunjung tanpa sesi terverifikasi. */
	it("mengalihkan anonymous ke login", async function rejectAnonymous() {
		configure();
		mocks.user.mockResolvedValue({ data: { user: null }, error: null });
		await expect(requireSession()).rejects.toThrow("REDIRECT:/");
	});
	/** Mengabaikan role admin pada metadata pengguna. */
	it("menolak akses lintas peran", async function rejectRoleForgery() {
		configure();
		mocks.profile.mockResolvedValue({
			data: { id: "user", role: "participant", is_active: true },
			error: null,
		});
		await expect(requireSession(["admin"])).rejects.toThrow(
			"REDIRECT:/peserta",
		);
	});
	/** Membaca ulang profil sehingga pencabutan akses berlaku pada permintaan berikutnya. */
	it("menolak akun yang dinonaktifkan saat sesi masih ada", async function revokeActiveSession() {
		configure();
		mocks.profile
			.mockResolvedValueOnce({
				data: { id: "user", role: "mentor_general", is_active: true },
				error: null,
			})
			.mockResolvedValueOnce({
				data: { id: "user", role: "mentor_general", is_active: false },
				error: null,
			});
		expect((await requireSession(["mentor_general"])).profile.role).toBe(
			"mentor_general",
		);
		await expect(requireSession()).rejects.toThrow("REDIRECT:/?auth=inactive");
	});
});
