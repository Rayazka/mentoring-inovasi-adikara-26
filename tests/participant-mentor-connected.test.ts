// TODO: Lengkapi E2E pemilihan slot yang berubah setelah halaman dibuka.
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Menyiapkan katalog, profil dan prasyarat peserta tanpa fixtures produksi. */
	function setup() {
		return {
			session: vi.fn(),
			mentor: vi.fn(),
			settings: vi.fn(),
			team: vi.fn(),
			work: vi.fn(),
			slots: vi.fn(),
			catalog: vi.fn(),
		};
	},
);
vi.mock(
	"server-only",
	/** Mengizinkan impor controller server pada pengujian unit. */ function serverOnly() {
		return {};
	},
);
vi.mock(
	"@/lib/auth/session",
	/** Mengembalikan sesi peserta yang terverifikasi. */ function session() {
		return { requireSession: mocks.session };
	},
);
vi.mock(
	"@/models/connected/team-repository",
	/** Mengendalikan prasyarat tim peserta. */ function team() {
		return { readParticipantTeam: mocks.team };
	},
);
vi.mock(
	"@/models/connected/work-repository",
	/** Mengendalikan kesiapan karya tersimpan. */ function work() {
		return { readTeamWork: mocks.work };
	},
);
vi.mock(
	"@/models/connected/mentor-repository",
	/** Mengisolasi profil dan slot dari jaringan eksternal. */ function repository() {
		return {
			readPublicMentor: mocks.mentor,
			readEventSettings: mocks.settings,
			readAvailableSlots: mocks.slots,
			readMentorCatalog: mocks.catalog,
		};
	},
);
import {
	loadParticipantMentor,
	loadParticipantCatalog,
} from "../src/controllers/connected/participant-mentor";
import {
	parseCatalogFilters,
	slotAvailability,
	type AvailableSlot,
} from "../src/models/connected/mentor";
const id = "11111111-1111-4111-8111-111111111111";
/** Menyiapkan mentor satu hari dengan peserta tanpa tim. */
beforeEach(function reset() {
	vi.clearAllMocks();
	mocks.session.mockResolvedValue({
		user: { id: "participant" },
		supabase: {},
	});
	mocks.mentor.mockResolvedValue({ id, available_dates: ["2026-10-24"] });
	mocks.settings.mockResolvedValue({ dates: ["2026-10-24", "2026-10-25"] });
	mocks.team.mockResolvedValue(null);
	mocks.work.mockResolvedValue(null);
	mocks.slots.mockResolvedValue([]);
	mocks.catalog.mockResolvedValue({ mentors: [], total: 0 });
});
/** Mempertahankan browsing tanpa mengizinkan pengajuan sebelum tim tersedia. */
it("membuka profil tanpa tim dan membatasi tanggal layanan", async function noTeam() {
	const data = await loadParticipantMentor(id, "2026-10-25");
	expect(data.mentor).toBeTruthy();
	expect(data.restriction).toContain("tim");
	expect(data.date).toBe("2026-10-24");
	expect(mocks.slots).toHaveBeenCalledWith({}, id, "2026-10-24");
});
/** Menolak CTA pengajuan bagi anggota biasa walaupun karya tim lengkap. */
it("membedakan akses anggota dan ketua", async function memberRestriction() {
	mocks.team.mockResolvedValue({ id: "team", leader_id: "other" });
	expect((await loadParticipantMentor(id, undefined)).restriction).toContain(
		"ketua",
	);
});
/** Mempertahankan filter pada kegagalan agar peserta tidak mengulang pencarian. */
it("menampilkan error katalog tanpa menyamarkan hasil sebagai kosong", async function failedCatalog() {
	mocks.catalog.mockRejectedValue(new Error("network"));
	const data = await loadParticipantCatalog({ q: "Emir", date: "2026-10-25" });
	expect(data.error).toBe(true);
	expect(data.filters.query).toBe("Emir");
	expect(data.filters.date).toBe("2026-10-25");
});
/** Memberi label penuh dan lewat dari data slot aktual, bukan angka ketersediaan rekaan. */
it("menentukan status slot dan menolak filter rusak", function slotStates() {
	const slot = {
		enabled: true,
		is_booked: true,
		starts_at: "2026-10-24T18:30:00+07:00",
	} as AvailableSlot;
	expect(slotAvailability(slot, Date.parse("2026-10-23T00:00:00Z"))).toBe(
		"Penuh",
	);
	expect(slotAvailability(slot, Date.parse("2026-10-25T00:00:00Z"))).toBe(
		"Sudah lewat",
	);
	expect(
		parseCatalogFilters({
			date: "2026-99-99",
			page: "-1",
			expertise: "unknown",
		}),
	).toEqual({ query: "", date: "", page: 1, expertise: "" });
});
