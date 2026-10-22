// TODO: Lengkapi E2E stale slot dan retry sesudah respons jaringan terputus pada deployment.
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Menyiapkan transaksi dan identitas tim tanpa mengakses data produksi. */
	function setup() {
		return {
			session: vi.fn(),
			team: vi.fn(),
			request: vi.fn(),
			rpc: vi.fn(),
			revalidate: vi.fn(),
		};
	},
);
vi.mock(
	"server-only",
	/** Mengizinkan impor action pada unit test. */ function serverOnly() {
		return {};
	},
);
vi.mock(
	"@/lib/auth/session",
	/** Mengendalikan sesi peserta untuk pengujian otorisasi. */ function session() {
		return { requireSession: mocks.session };
	},
);
vi.mock(
	"@/models/connected/team-repository",
	/** Mengembalikan tim yang telah diverifikasi database. */ function team() {
		return { readParticipantTeam: mocks.team };
	},
);
vi.mock(
	"next/cache",
	/** Mencatat pembaruan daftar setelah pengiriman berhasil. */ function cache() {
		return { revalidatePath: mocks.revalidate };
	},
);
import { submitParticipantRequest } from "../src/controllers/connected/submission-actions";
vi.mock(
	"@/models/connected/request-repository",
	/** Memeriksa revisi berdasarkan pengajuan milik tim aktif. */ function requests() {
		return { readParticipantRequest: mocks.request };
	},
);
import { resubmitParticipantRequest } from "../src/controllers/connected/revision-actions";
const id = "11111111-1111-4111-8111-111111111111";
/** Mengirim ulang ke baris yang sama agar snapshot dan event diperbarui oleh database. */
it("mengirim ulang revisi tanpa membuat request baru", async function resubmit() {
	mocks.request.mockResolvedValue({ id, status: "revision_requested" });
	const input = form();
	input.set("request", id);
	expect(
		(await resubmitParticipantRequest({ error: null }, input)).requestId,
	).toBe(id);
	expect(mocks.rpc).toHaveBeenCalledWith("resubmit_request", {
		p_request: id,
		p_slot: id,
		p_documents: [id],
	});
});
/** Mengembalikan status terkirim saat respons pengiriman ulang sebelumnya terputus. */
it("tidak menggandakan pengiriman ulang yang sudah pending", async function alreadyPending() {
	mocks.request.mockResolvedValue({ id, status: "pending" });
	const input = form();
	input.set("request", id);
	expect(
		(await resubmitParticipantRequest({ error: null }, input)).requestId,
	).toBe(id);
	expect(mocks.rpc).not.toHaveBeenCalled();
});
/** Tidak menerima pengajuan tim lain meskipun UUID valid. */
it("menolak kirim ulang lintas tim", async function foreignRevision() {
	mocks.request.mockResolvedValue(null);
	const input = form();
	input.set("request", id);
	expect(
		(await resubmitParticipantRequest({ error: null }, input)).error,
	).toBeTruthy();
	expect(mocks.rpc).not.toHaveBeenCalled();
});
/** Menyiapkan ketua tim dan respons RPC idempoten. */
beforeEach(function reset() {
	vi.clearAllMocks();
	mocks.session.mockResolvedValue({
		user: { id: "leader" },
		supabase: { rpc: mocks.rpc },
	});
	mocks.team.mockResolvedValue({ id: "own-team", leader_id: "leader" });
	mocks.rpc.mockResolvedValue({ data: id, error: null });
});
/** Menyusun pilihan slot dan kunci pengiriman yang tetap selama retry. */
function form() {
	const input = new FormData();
	input.set("slot", id);
	input.set("key", id);
	input.set("team", "foreign-team");
	input.append("documents", id);
	return input;
}
/** Menolak anggota yang mengirim action langsung meskipun mengetahui UUID slot. */
it("menolak pengiriman nonketua", async function nonLeader() {
	mocks.team.mockResolvedValue({ id: "own-team", leader_id: "other" });
	expect(
		(await submitParticipantRequest({ error: null }, form())).error,
	).toContain("ketua");
	expect(mocks.rpc).not.toHaveBeenCalled();
});
/** Menggunakan tim sesi dan mempertahankan idempotency key pada setiap retry. */
it("meneruskan kunci retry dan identitas tim yang sah", async function retryKey() {
	const first = await submitParticipantRequest({ error: null }, form());
	const second = await submitParticipantRequest({ error: null }, form());
	expect(first.requestId).toBe(second.requestId);
	expect(mocks.rpc).toHaveBeenLastCalledWith("submit_request", {
		p_team: "own-team",
		p_slot: id,
		p_key: id,
		p_documents: [id],
	});
});
/** Menyampaikan konflik slot dari transaksi tanpa menampilkan sukses palsu. */
it("menolak slot yang berubah", async function staleSlot() {
	mocks.rpc.mockResolvedValue({
		data: null,
		error: { code: "P0001", message: "Jadwal sudah terbooking." },
	});
	expect(
		(await submitParticipantRequest({ error: null }, form())).error,
	).toContain("terbooking");
	expect(mocks.revalidate).not.toHaveBeenCalled();
});
/** Tidak menyisipkan judul karya dari browser ke transaksi snapshot server. */
it("menolak dokumen dengan identitas tidak valid", async function invalidDocuments() {
	const input = form();
	input.append("documents", "foreign/path");
	expect(
		(await submitParticipantRequest({ error: null }, input)).error,
	).toBeTruthy();
	expect(mocks.rpc).not.toHaveBeenCalled();
});
