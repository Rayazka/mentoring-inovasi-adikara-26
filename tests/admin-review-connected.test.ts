// TODO: Lengkapi UAT dua admin yang menyetujui slot sama secara bersamaan pada staging.
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Menyiapkan sesi dan hasil transaksi keputusan. */
	function setup() {
		return { session: vi.fn(), rpc: vi.fn(), revalidate: vi.fn() };
	},
);
vi.mock(
	"server-only",
	/** Mengizinkan modul server pada unit test. */ function serverOnly() {
		return {};
	},
);
vi.mock(
	"@/lib/auth/session",
	/** Mengisolasi pemeriksaan peran dari autentikasi provider. */ function session() {
		return { requireSession: mocks.session };
	},
);
vi.mock(
	"next/cache",
	/** Mencatat invalidasi lintas peran setelah transaksi berhasil. */ function cache() {
		return { revalidatePath: mocks.revalidate };
	},
);
import { reviewAdminRequest } from "../src/controllers/connected/admin-review-actions";
import { reviewInput } from "../src/models/connected/review";
/** Menyiapkan akun admin terverifikasi. */
beforeEach(function reset() {
	vi.clearAllMocks();
	mocks.session.mockResolvedValue({ supabase: { rpc: mocks.rpc } });
	mocks.rpc.mockResolvedValue({ error: null });
});
/** Menyusun input persetujuan dengan konfirmasi eksplisit. */
function input() {
	return {
		request: "11111111-1111-4111-8111-111111111111",
		decision: "approved",
		meeting: "https://meet.google.com/example",
		note: "",
		revision: "work",
		confirmation: "KONFIRMASI",
	};
}
/** Memaksa persyaratan setiap keputusan sebelum transaksi dijalankan. */
it("menolak ACC tanpa meeting dan revisi tanpa catatan", function requiredFields() {
	expect(reviewInput.safeParse({ ...input(), meeting: "" }).success).toBe(
		false,
	);
	expect(
		reviewInput.safeParse({ ...input(), decision: "revision_requested" })
			.success,
	).toBe(false);
});
/** Menolak aksi langsung mentor general melalui guard server. */
it("memeriksa admin sebelum menulis keputusan", async function adminOnly() {
	mocks.session.mockRejectedValue(new Error("REDIRECT"));
	await expect(
		reviewAdminRequest({ error: null }, new FormData()),
	).rejects.toThrow("REDIRECT");
	expect(mocks.session).toHaveBeenCalledWith(["admin"]);
	expect(mocks.rpc).not.toHaveBeenCalled();
});
/** Menyerahkan booking, event dan keputusan kepada satu RPC atomik. */
it("memanggil transaksi persetujuan", async function approved() {
	const form = new FormData();
	for (const [key, value] of Object.entries(input())) form.set(key, value);
	expect((await reviewAdminRequest({ error: null }, form)).error).toBeNull();
	expect(mocks.rpc).toHaveBeenCalledWith("review_request", {
		p_request: input().request,
		p_decision: "approved",
		p_note: "",
		p_meeting_url: input().meeting,
		p_revision_kind: null,
	});
});
/** Menyampaikan konflik booking tanpa menampilkan keputusan berhasil. */
it("mempertahankan error benturan slot", async function conflict() {
	mocks.rpc.mockResolvedValue({
		error: {
			message:
				"Jadwal baru saja terbooking atau bentrok dengan sesi tim. Minta revisi jadwal.",
		},
	});
	const form = new FormData();
	for (const [key, value] of Object.entries(input())) form.set(key, value);
	expect((await reviewAdminRequest({ error: null }, form)).error).toContain(
		"bentrok",
	);
	expect(mocks.revalidate).not.toHaveBeenCalled();
});
