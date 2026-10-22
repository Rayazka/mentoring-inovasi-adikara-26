// TODO: Lengkapi UAT upload 10 MB, jaringan terputus, dan token kedaluwarsa pada Storage staging.
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Menyiapkan batas sesi, RPC, dan Storage istimewa secara terpisah. */
	function setup() {
		return {
			session: vi.fn(),
			team: vi.fn(),
			rpc: vi.fn(),
			signed: vi.fn(),
			metadata: vi.fn(),
			download: vi.fn(),
			remove: vi.fn(),
			complete: vi.fn(),
			revalidate: vi.fn(),
		};
	},
);
vi.mock(
	"server-only",
	/** Mengizinkan modul server pada runner unit. */ function serverOnly() {
		return {};
	},
);
vi.mock(
	"@/lib/auth/session",
	/** Mengendalikan sesi aktif tanpa kredensial produksi. */ function session() {
		return { requireSession: mocks.session };
	},
);
vi.mock(
	"@/models/connected/team-repository",
	/** Membatasi tim yang diakui oleh controller. */ function team() {
		return { readParticipantTeam: mocks.team };
	},
);
vi.mock(
	"next/cache",
	/** Mencatat invalidasi hanya setelah verifikasi berhasil. */ function cache() {
		return { revalidatePath: mocks.revalidate };
	},
);
vi.mock(
	"@/lib/supabase/storage-admin",
	/** Memisahkan akses istimewa agar penolakan sebelum penandatanganan dapat diperiksa. */ function storageAdmin() {
		return {
			/** Menghasilkan client khusus Storage tanpa secret nyata. */
			createStorageAdmin: function admin() {
				return {
					rpc: mocks.complete,
					storage: {
						/** Mengembalikan operasi bucket untuk objek yang telah diotorisasi. */
						from: function bucket() {
							return {
								createSignedUploadUrl: mocks.signed,
								download: mocks.download,
								remove: mocks.remove,
							};
						},
					},
				};
			},
		};
	},
);
import {
	prepareParticipantUpload,
	finishParticipantUpload,
} from "../src/controllers/connected/upload-actions";
import {
	uploadInput,
	hasFileSignature,
} from "../src/models/connected/document";
const id = "11111111-1111-4111-8111-111111111111";
/** Menyiapkan file PDF dengan metadata yang konsisten. */
beforeEach(function reset() {
	vi.clearAllMocks();
	const query = {
		select: vi.fn(),
		eq: vi.fn(),
		is: vi.fn(),
		maybeSingle: mocks.metadata,
	};
	query.select.mockReturnValue(query);
	query.eq.mockReturnValue(query);
	query.is.mockReturnValue(query);
	mocks.session.mockResolvedValue({
		user: { id: "participant" },
		supabase: {
			rpc: mocks.rpc,
			/** Membaca dokumen melalui RLS client peserta. */
			from: function from() {
				return query;
			},
		},
	});
	mocks.team.mockResolvedValue({ id: "team" });
	mocks.rpc.mockResolvedValue({
		data: { id, title: "Proposal", object_path: `team/${id}/file.pdf` },
		error: null,
	});
	mocks.signed.mockResolvedValue({
		data: { token: "temporary-upload-token" },
		error: null,
	});
	mocks.metadata.mockResolvedValue({
		data: {
			id,
			object_path: `team/${id}/file.pdf`,
			bytes: 5,
			mime_type: "application/pdf",
			ready: false,
		},
		error: null,
	});
	mocks.download.mockResolvedValue({ data: new Blob(["%PDF-"]), error: null });
	mocks.complete.mockResolvedValue({ error: null });
});
/** Memaksa batas ukuran dan kesesuaian ekstensi sebelum kuota atau token dibuat. */
it("menolak file melebihi batas atau ekstensi palsu", async function invalidFile() {
	expect(
		uploadInput.safeParse({
			title: "A",
			filename: "a.exe",
			bytes: 10,
			mime: "application/pdf",
		}).success,
	).toBe(false);
	expect(
		(
			await prepareParticipantUpload({
				title: "A",
				filename: "a.pdf",
				bytes: 10485761,
				mime: "application/pdf",
			})
		).error,
	).toBeTruthy();
	expect(mocks.rpc).not.toHaveBeenCalled();
	expect(mocks.signed).not.toHaveBeenCalled();
});
/** Memastikan penandatanganan dilakukan hanya setelah reservasi kuota berhasil. */
it("membuat izin unggah hanya untuk path reservasi", async function reserveBeforeSigning() {
	const result = await prepareParticipantUpload({
		title: "Proposal",
		filename: "file.pdf",
		bytes: 5,
		mime: "application/pdf",
	});
	expect(result.grant?.id).toBe(id);
	expect(mocks.signed).toHaveBeenCalledWith(`team/${id}/file.pdf`, {
		upsert: false,
	});
});
/** Menolak dokumen yang disembunyikan RLS atau bukan milik pengunggah aktif. */
it("tidak menggunakan service role untuk dokumen tanpa izin", async function unauthorizedDocument() {
	mocks.metadata.mockResolvedValue({ data: null, error: null });
	expect((await finishParticipantUpload(id)).error).toBeTruthy();
	expect(mocks.download).not.toHaveBeenCalled();
	expect(mocks.complete).not.toHaveBeenCalled();
});
/** Memeriksa isi aktual sebelum menandai file siap digunakan. */
it("menolak signature file palsu dan membersihkan objeknya", async function invalidSignature() {
	mocks.download.mockResolvedValue({ data: new Blob(["hello"]), error: null });
	expect((await finishParticipantUpload(id)).error).toContain("tidak sesuai");
	expect(mocks.complete).not.toHaveBeenCalled();
	expect(mocks.remove).toHaveBeenCalledOnce();
});
/** Menyelesaikan metadata melalui fungsi service yang memeriksa ukuran dan MIME Storage. */
it("menyelesaikan file valid dan mengizinkan retry idempoten", async function completeUpload() {
	expect((await finishParticipantUpload(id)).error).toBeNull();
	expect(mocks.complete).toHaveBeenCalledWith("complete_document_upload", {
		p_document: id,
	});
	mocks.metadata.mockResolvedValue({ data: { ready: true }, error: null });
	expect((await finishParticipantUpload(id)).error).toBeNull();
	expect(mocks.complete).toHaveBeenCalledOnce();
});
/** Memastikan format gambar tidak diterima hanya karena MIME yang dideklarasikan. */
it("memeriksa header format yang didukung", function signatures() {
	expect(hasFileSignature(new Uint8Array([255, 216, 255]), "image/jpeg")).toBe(
		true,
	);
	expect(hasFileSignature(new Uint8Array([80, 75, 3, 4]), "image/png")).toBe(
		false,
	);
});
