// TODO: Lengkapi pengujian browser lintas akun untuk pembaruan hitungan anggota setelah keputusan.
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Menyiapkan sesi, kepemimpinan, dan hasil transaksi tanpa data peserta nyata. */
	function setup() {
		return {
			session: vi.fn(),
			team: vi.fn(),
			rpc: vi.fn(),
			maybeSingle: vi.fn(),
			revalidate: vi.fn(),
		};
	},
);
vi.mock(
	"server-only",
	/** Mengisolasi modul server dalam pengujian unit. */ function serverOnly() {
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
	/** Mengendalikan tim aktif yang dibaca dari RLS. */ function repository() {
		return { readParticipantTeam: mocks.team };
	},
);
vi.mock(
	"next/cache",
	/** Mencatat invalidasi hanya setelah transaksi berhasil. */ function cache() {
		return { revalidatePath: mocks.revalidate };
	},
);
import { reviewParticipantJoin } from "../src/controllers/connected/team-actions";

/** Menyiapkan pemohon milik tim ketua yang sedang login. */
beforeEach(function reset() {
	vi.clearAllMocks();
	const query = {
		select: vi.fn(),
		eq: vi.fn(),
		maybeSingle: mocks.maybeSingle,
	};
	query.select.mockReturnValue(query);
	query.eq.mockReturnValue(query);
	mocks.session.mockResolvedValue({
		user: { id: "leader" },
		supabase: {
			rpc: mocks.rpc,
			/** Mengembalikan kueri pemohon yang tetap dibatasi RLS pada aplikasi sebenarnya. */
			from: function from() {
				return query;
			},
		},
	});
	mocks.team.mockResolvedValue({ id: "team", leader_id: "leader" });
	mocks.maybeSingle.mockResolvedValue({
		data: { team_id: "team" },
		error: null,
	});
	mocks.rpc.mockResolvedValue({ error: null });
});
/** Menyusun input keputusan yang tidak menerima identitas ketua dari browser. */
function decision() {
	const form = new FormData();
	form.set("join", "11111111-1111-4111-8111-111111111111");
	form.set("decision", "accept");
	return form;
}
/** Menolak anggota biasa meskipun mengirim action secara langsung. */
it("menolak keputusan anggota biasa", async function nonLeader() {
	mocks.team.mockResolvedValue({ id: "team", leader_id: "other" });
	expect(
		(await reviewParticipantJoin({ error: null }, decision())).error,
	).toContain("Hanya ketua");
	expect(mocks.rpc).not.toHaveBeenCalled();
});
/** Menolak ketua yang mencoba memproses permintaan untuk tim lain. */
it("menolak permintaan lintas tim", async function foreignTeam() {
	mocks.maybeSingle.mockResolvedValue({
		data: { team_id: "foreign" },
		error: null,
	});
	expect(
		(await reviewParticipantJoin({ error: null }, decision())).error,
	).toContain("tidak tersedia");
	expect(mocks.rpc).not.toHaveBeenCalled();
});
/** Membiarkan transaksi database memeriksa ulang kapasitas sebelum mengubah hasil pada UI. */
it("mengirim keputusan ketua dan memperbarui halaman setelah sukses", async function accepted() {
	expect(
		(await reviewParticipantJoin({ error: null }, decision())).error,
	).toBeNull();
	expect(mocks.rpc).toHaveBeenCalledWith("review_team_join", {
		p_join: "11111111-1111-4111-8111-111111111111",
		p_accept: true,
	});
	expect(mocks.revalidate).toHaveBeenCalledOnce();
});
/** Menyampaikan konflik kursi terakhir tanpa mengklaim anggota sudah diterima. */
it("menampilkan kegagalan kapasitas database", async function capacityConflict() {
	mocks.rpc.mockResolvedValue({
		error: { code: "P0001", message: "Tim penuh." },
	});
	expect((await reviewParticipantJoin({ error: null }, decision())).error).toBe(
		"Tim penuh.",
	);
	expect(mocks.revalidate).not.toHaveBeenCalled();
});
