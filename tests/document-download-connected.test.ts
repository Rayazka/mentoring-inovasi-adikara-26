// TODO: Lengkapi pengujian JWT dan kedaluwarsa signed URL terhadap Storage staging.
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Menyiapkan hasil RLS metadata dan kebijakan Storage yang independen. */
	function setup() {
		return { session: vi.fn(), metadata: vi.fn(), sign: vi.fn() };
	},
);
vi.mock(
	"server-only",
	/** Mengizinkan controller server dibaca runner unit. */ function serverOnly() {
		return {};
	},
);
vi.mock(
	"@/lib/auth/session",
	/** Mengganti sesi nyata dengan cakupan akses terkontrol. */ function session() {
		return { requireSession: mocks.session };
	},
);
import { authorizeDocumentDownload } from "../src/controllers/connected/document-download";
const id = "11111111-1111-4111-8111-111111111111";
/** Menyiapkan metadata dan signed URL yang tidak menggunakan secret server. */
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
		supabase: {
			/** Mengembalikan pembacaan metadata di bawah RLS akun peminta. */
			from: function from() {
				return query;
			},
			storage: {
				/** Mengembalikan operasi tanda tangan Storage pada client sesi yang sama. */ from: function bucket() {
					return { createSignedUrl: mocks.sign };
				},
			},
		},
	});
	mocks.metadata.mockResolvedValue({
		data: { object_path: "team/document/file.pdf", filename: "proposal.pdf" },
		error: null,
	});
	mocks.sign.mockResolvedValue({
		data: { signedUrl: "https://storage.example/signed" },
		error: null,
	});
});
/** Menolak data milik tim lain ketika metadata disembunyikan RLS. */
it("tidak menandatangani objek tanpa metadata berizin", async function deniedMetadata() {
	mocks.metadata.mockResolvedValue({ data: null, error: null });
	expect(await authorizeDocumentDownload(id)).toBeNull();
	expect(mocks.sign).not.toHaveBeenCalled();
});
/** Tidak menerima object path yang dimanipulasi melalui URL endpoint. */
it("menolak path sebagai pengganti UUID", async function maliciousPath() {
	expect(await authorizeDocumentDownload("../../foreign/file.pdf")).toBeNull();
	expect(mocks.metadata).not.toHaveBeenCalled();
});
/** Mempertahankan batas masa berlaku dan pilihan nama unduhan asli. */
it("menggunakan URL 60 detik melalui client pengguna", async function shortExpiry() {
	expect(await authorizeDocumentDownload(id)).toBe(
		"https://storage.example/signed",
	);
	expect(mocks.sign).toHaveBeenCalledWith("team/document/file.pdf", 60, {
		download: "proposal.pdf",
	});
});
/** Menghormati penolakan Storage meskipun metadata terbaca. */
it("menolak ketika kebijakan objek tidak mengizinkan", async function deniedObject() {
	mocks.sign.mockResolvedValue({ data: null, error: { message: "denied" } });
	expect(await authorizeDocumentDownload(id)).toBeNull();
});
