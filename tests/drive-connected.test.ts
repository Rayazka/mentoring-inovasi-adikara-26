// TODO: Lengkapi pengujian pelaporan akses setelah RPC administratif khusus ditambahkan.
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Mengisolasi sesi, keanggotaan dan metadata dokumen. */
	function setup() {
		return {
			session: vi.fn(),
			team: vi.fn(),
			rpc: vi.fn(),
			metadata: vi.fn(),
			revalidate: vi.fn(),
		};
	},
);
vi.mock(
	"server-only",
	/** Mengizinkan controller server pada pengujian unit. */ function serverOnly() {
		return {};
	},
);
vi.mock(
	"@/lib/auth/session",
	/** Menyediakan sesi peserta terkontrol. */ function session() {
		return { requireSession: mocks.session };
	},
);
vi.mock(
	"@/models/connected/team-repository",
	/** Menentukan tim aktif yang sah. */ function team() {
		return { readParticipantTeam: mocks.team };
	},
);
vi.mock(
	"next/cache",
	/** Merekam invalidasi setelah perubahan tersimpan. */ function cache() {
		return { revalidatePath: mocks.revalidate };
	},
);
import { saveParticipantDrive } from "../src/controllers/connected/document-actions";
import { driveInput } from "../src/models/connected/document";

/** Menyiapkan peserta biasa dan dokumen yang dapat diperbarui olehnya. */
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
			/** Membaca metadata menggunakan client sesi yang sama. */
			from: function from() {
				return query;
			},
		},
	});
	mocks.team.mockResolvedValue({ id: "team", leader_id: "leader" });
	mocks.rpc.mockResolvedValue({ error: null });
	mocks.metadata.mockResolvedValue({
		data: { uploaded_by: "participant" },
		error: null,
	});
});
/** Menyusun isian link yang aman. */
function form(document = "") {
	const data = new FormData();
	data.set("document", document);
	data.set("title", "Proposal");
	data.set("url", "https://drive.google.com/drive/folders/example");
	return data;
}
/** Menolak URL rusak, protokol aktif, host tiruan dan kredensial tersembunyi. */
it.each([
	"not-url",
	"javascript:alert(1)",
	"https://drive.google.com.evil.test/a",
	"https://evil@drive.google.com/a",
	"http://drive.google.com/a",
	"https://drive.google.com/",
])(
	"menolak link tidak aman: %s",
	/** Memastikan validasi tidak melempar exception untuk URL yang rusak. */
	function unsafeUrl(url) {
		expect(
			driveInput.safeParse({ title: "A", document: "", url }).success,
		).toBe(false);
	},
);
/** Menggunakan tim sesi untuk link baru tanpa melakukan permintaan HTTP ke URL pengguna. */
it("menambah link lewat RPC tim aktif", async function createLink() {
	expect(
		(await saveParticipantDrive({ error: null }, form())).error,
	).toBeNull();
	expect(mocks.rpc).toHaveBeenCalledWith("reserve_document", {
		p_team: "team",
		p_title: "Proposal",
		p_kind: "drive",
		p_url: "https://drive.google.com/drive/folders/example",
	});
});
/** Menolak penyuntingan link anggota lain kecuali oleh ketua. */
it("menolak perubahan dokumen pengunggah lain", async function deniedEdit() {
	mocks.metadata.mockResolvedValue({
		data: { uploaded_by: "other" },
		error: null,
	});
	expect(
		(
			await saveParticipantDrive(
				{ error: null },
				form("11111111-1111-4111-8111-111111111111"),
			)
		).error,
	).toContain("pengunggah");
	expect(mocks.rpc).not.toHaveBeenCalled();
});
