// TODO: Lengkapi UAT penyuntingan karya dari dua perangkat pada tim yang sama.
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Mengisolasi identitas tim dan RPC dari layanan produksi. */
	function setup() {
		return {
			session: vi.fn(),
			team: vi.fn(),
			rpc: vi.fn(),
			revalidate: vi.fn(),
		};
	},
);
vi.mock(
	"server-only",
	/** Menjalankan controller server dalam unit test. */ function serverOnly() {
		return {};
	},
);
vi.mock(
	"@/lib/auth/session",
	/** Mengembalikan sesi peserta terkontrol. */ function session() {
		return { requireSession: mocks.session };
	},
);
vi.mock(
	"@/models/connected/team-repository",
	/** Membaca keanggotaan dari hasil terkontrol. */ function team() {
		return { readParticipantTeam: mocks.team };
	},
);
vi.mock(
	"next/cache",
	/** Merekam pembaruan halaman setelah simpan berhasil. */ function cache() {
		return { revalidatePath: mocks.revalidate };
	},
);
import { saveParticipantWork } from "../src/controllers/connected/work-actions";
import { workInput, isConnectedWorkReady } from "../src/models/connected/work";

/** Menyiapkan peserta yang mempunyai tim aktif. */
beforeEach(function reset() {
	vi.clearAllMocks();
	mocks.session.mockResolvedValue({
		user: { id: "participant" },
		supabase: { rpc: mocks.rpc },
	});
	mocks.team.mockResolvedValue({ id: "own-team" });
	mocks.rpc.mockResolvedValue({ error: null });
});
/** Menyusun form karya tanpa identitas tim yang dipercaya dari browser. */
function workForm(intent: string, title = "", description = "") {
	const form = new FormData();
	form.set("intent", intent);
	form.set("title", title);
	form.set("description", description);
	form.set("team", "foreign-team");
	return form;
}
/** Mengizinkan draf parsial namun menolak karya siap yang tidak lengkap. */
it("membedakan draf dan kelengkapan", async function draftVsReady() {
	expect(
		workInput.safeParse({ title: "", description: "", intent: "draft" })
			.success,
	).toBe(true);
	expect(
		(await saveParticipantWork({ error: null }, workForm("ready", "Judul")))
			.error,
	).toBeTruthy();
	expect(mocks.rpc).not.toHaveBeenCalled();
	expect(isConnectedWorkReady(null)).toBe(false);
});
/** Menggunakan tim sesi sehingga pemalsuan tim dari form tidak berpengaruh. */
it("menyimpan karya milik tim sesi", async function ownWork() {
	expect(
		(await saveParticipantWork({ error: null }, workForm("draft", "Ide")))
			.error,
	).toBeNull();
	expect(mocks.rpc).toHaveBeenCalledWith("save_work", {
		p_team: "own-team",
		p_title: "Ide",
		p_description: "",
		p_draft: true,
	});
});
/** Menolak akses setelah peserta tidak lagi mempunyai tim. */
it("menolak mantan anggota", async function formerMember() {
	mocks.team.mockResolvedValue(null);
	expect(
		(
			await saveParticipantWork(
				{ error: null },
				workForm("ready", "Judul", "Gambaran"),
			)
		).error,
	).toContain("tim");
	expect(mocks.rpc).not.toHaveBeenCalled();
});
/** Tidak mengonfirmasi penyimpanan atau menghapus konteks saat RPC gagal. */
it("melaporkan kegagalan simpan", async function failedSave() {
	mocks.rpc.mockRejectedValue(new Error("network"));
	expect(
		(
			await saveParticipantWork(
				{ error: null },
				workForm("ready", "Judul", "Gambaran"),
			)
		).error,
	).toBeTruthy();
	expect(mocks.revalidate).not.toHaveBeenCalled();
});
