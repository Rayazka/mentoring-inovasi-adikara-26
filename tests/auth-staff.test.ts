// TODO: Pertahankan bukti login staf nyata terpisah dari pengujian adapter tanpa kredensial.
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Menyiapkan respons autentikasi dan profil untuk setiap skenario staf. */
	function createMocks() {
		return {
			password: vi.fn(),
			profile: vi.fn(),
			signOut: vi.fn(),
			select: vi.fn(),
			eq: vi.fn(),
		};
	},
);
vi.mock(
	"server-only",
	/** Mengizinkan modul khusus server diuji pada runner Node. */
	function mockServerOnly() {
		return {};
	},
);
vi.mock(
	"@/lib/supabase/server",
	/** Mengganti adapter Supabase dengan respons terkontrol. */
	function mockSupabase() {
		return {
			createClient:
				/** Membuat client tanpa jaringan atau cookie pengguna nyata. */
				async function mockClient() {
					return {
						auth: {
							signInWithPassword: mocks.password,
							signOut: mocks.signOut,
						},
						from:
							/** Membatasi fixture query pada proyeksi profil staf. */
							function from() {
								return {
									select:
										/** Merekam kolom yang dibaca agar pemeriksaan akun aktif tidak hilang. */
										function select(columns: string) {
											mocks.select(columns);
											return {
												eq:
													/** Memastikan pencarian profil memakai identitas hasil autentikasi. */
													function eq(column: string, id: string) {
														mocks.eq(column, id);
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
import { authenticateStaff } from "../src/controllers/auth/staff-login";
/** Membersihkan konfigurasi dan pemanggilan antar skenario. */
afterEach(function cleanMocks() {
	vi.unstubAllEnvs();
	vi.clearAllMocks();
});
/** Menguji password hanya memberi sesi staf bila profil database aktif dan berwenang. */
describe("login staf", function staffScenarios() {
	/** Menyiapkan input dengan role palsu yang wajib diabaikan. */
	function form() {
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_contoh");
		const data = new FormData();
		data.set("email", "staff@example.com");
		data.set("password", "test-only-password");
		data.set("role", "admin");
		mocks.password.mockResolvedValue({
			data: { user: { id: "verified-user" } },
			error: null,
		});
		return data;
	}
	/** Menerima staf aktif dan mencari profil dari ID hasil login, bukan form. */
	it("menerima admin dan mentor general aktif", async function acceptActiveStaff() {
		for (const role of ["admin", "mentor_general"]) {
			const input = form();
			mocks.profile.mockResolvedValue({
				data: { role, is_active: true },
				error: null,
			});
			expect(await authenticateStaff(input)).toEqual({ error: null });
			expect(mocks.eq).toHaveBeenCalledWith("id", "verified-user");
		}
	});
	/** Mencabut sesi lokal untuk peserta, peran lama, profil hilang dan akun nonaktif. */
	it("menolak eskalasi peran dan akun nonaktif", async function rejectUnauthorizedStaff() {
		for (const profile of [
			{ role: "participant", is_active: true },
			{ role: "mentor", is_active: true },
			{ role: "admin", is_active: false },
			null,
		]) {
			const input = form();
			mocks.profile.mockResolvedValue({ data: profile, error: null });
			expect((await authenticateStaff(input)).error).toBeTruthy();
		}
		expect(mocks.signOut).toHaveBeenCalledTimes(4);
	});
	/** Mengembalikan pesan umum tanpa query profil bila password salah. */
	it("menolak kredensial salah tanpa membocorkan akun", async function rejectWrongPassword() {
		const input = form();
		mocks.password.mockResolvedValue({
			data: { user: null },
			error: { message: "private provider error" },
		});
		const result = await authenticateStaff(input);
		expect(result.error).not.toContain("private provider error");
		expect(mocks.profile).not.toHaveBeenCalled();
	});
});
