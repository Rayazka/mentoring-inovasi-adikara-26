// TODO: Lengkapi skenario logout ketika strategi sesi berubah.
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Menyiapkan operasi sesi tanpa menghubungi layanan eksternal. */
	function setup() {
		return { signOut: vi.fn(), staff: vi.fn() };
	},
);
vi.mock(
	"@/controllers/auth/staff-login",
	/** Mengisolasi pengujian adapter action dari validasi kredensial. */
	function mockStaff() {
		return { authenticateStaff: mocks.staff };
	},
);
vi.mock(
	"@/lib/supabase/server",
	/** Menyediakan adapter logout yang dapat menghasilkan sukses atau gagal. */
	function mockClient() {
		return {
			createClient:
				/** Menghasilkan client palsu tanpa cookie pengguna. */
				async function create() {
					return { auth: { signOut: mocks.signOut } };
				},
		};
	},
);
vi.mock(
	"next/navigation",
	/** Mengubah redirect server menjadi hasil yang dapat diperiksa. */
	function mockNavigation() {
		return {
			redirect:
				/** Menghentikan action setelah pengalihan. */
				function redirect(path: string): never {
					throw new Error(`REDIRECT:${path}`);
				},
		};
	},
);
import { signOut, signInStaff } from "../src/app/auth/actions";
/** Membersihkan respons mock agar setiap skenario mandiri. */
afterEach(function clear() {
	vi.clearAllMocks();
});
/** Memastikan logout benar-benar memanggil Supabase sebelum kembali ke login. */
it("menutup sesi sebelum redirect", async function signOutBeforeRedirect() {
	mocks.signOut.mockResolvedValue({ error: null });
	await expect(signOut()).rejects.toThrow("REDIRECT:/");
	expect(mocks.signOut).toHaveBeenCalledOnce();
});
/** Tidak mengklaim logout berhasil bila penyedia sesi gagal. */
it("melaporkan kegagalan logout", async function failedSignOut() {
	mocks.signOut.mockResolvedValue({ error: { message: "internal" } });
	await expect(signOut()).rejects.toThrow("Tidak dapat keluar");
});
/** Meneruskan kegagalan staf ke formulir tanpa redirect. */
it("menampilkan kegagalan staf", async function failedStaff() {
	mocks.staff.mockResolvedValue({ error: "Login staf belum berhasil." });
	expect(await signInStaff({ error: null }, new FormData())).toEqual({
		error: "Login staf belum berhasil.",
	});
});
/** Tidak menerima tujuan redirect yang dikirim melalui formulir. */
it("mengarah ke dashboard terverifikasi", async function safeStaffDestination() {
	mocks.staff.mockResolvedValue({ error: null });
	const form = new FormData();
	form.set("next", "https://evil.example");
	await expect(signInStaff({ error: null }, form)).rejects.toThrow(
		"REDIRECT:/dashboard",
	);
});
