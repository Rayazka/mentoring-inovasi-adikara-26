// TODO: Lengkapi E2E dua tim berbeda dan akses snapshot file setelah penghapusan bahan.
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Menyiapkan pembacaan tim dan pengajuan untuk memeriksa urutan otorisasi. */
	function setup() {
		return {
			session: vi.fn(),
			team: vi.fn(),
			request: vi.fn(),
			documents: vi.fn(),
			events: vi.fn(),
			list: vi.fn(),
			counts: vi.fn(),
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
	/** Mengembalikan sesi pengguna yang sudah diverifikasi. */ function session() {
		return { requireSession: mocks.session };
	},
);
vi.mock(
	"@/models/connected/team-repository",
	/** Membatasi identitas tim yang diperbolehkan. */ function team() {
		return { readParticipantTeam: mocks.team };
	},
);
vi.mock(
	"@/models/connected/request-repository",
	/** Mengisolasi snapshot dan event agar pembacaan tanpa izin dapat dideteksi. */ function repository() {
		return {
			readParticipantRequest: mocks.request,
			readRequestDocumentSnapshots: mocks.documents,
			readRequestEvents: mocks.events,
			readParticipantRequests: mocks.list,
			readTeamRequestCounts: mocks.counts,
		};
	},
);
import {
	loadParticipantRequest,
	loadParticipantRequests,
} from "../src/controllers/connected/participant-requests";
import {
	participantRequestSchedule,
	type ParticipantRequest,
} from "../src/models/connected/request";
const id = "11111111-1111-4111-8111-111111111111";
/** Menyiapkan peserta aktif tanpa membuat data pada database produksi. */
beforeEach(function reset() {
	vi.clearAllMocks();
	mocks.session.mockResolvedValue({
		user: { id: "participant" },
		supabase: {},
	});
	mocks.team.mockResolvedValue({ id: "own-team", leader_id: "participant" });
	mocks.request.mockResolvedValue(null);
	mocks.documents.mockResolvedValue([]);
	mocks.events.mockResolvedValue([]);
});
/** Tidak membaca detail atau statistik jika peserta belum menjadi anggota. */
it("menghentikan pembacaan saat tidak memiliki tim", async function noTeam() {
	mocks.team.mockResolvedValue(null);
	expect((await loadParticipantRequests({})).kind).toBe("no-team");
	expect(mocks.list).not.toHaveBeenCalled();
});
/** Menahan snapshot dan event ketika ID pengajuan tidak ditemukan dalam tim aktif. */
it("tidak membuka bahan pengajuan lintas tim", async function foreignRequest() {
	expect((await loadParticipantRequest(id)).kind).toBe("not-found");
	expect(mocks.request).toHaveBeenCalledWith({}, "own-team", id);
	expect(mocks.documents).not.toHaveBeenCalled();
	expect(mocks.events).not.toHaveBeenCalled();
});
/** Membaca snapshot hanya setelah kepemilikan tim terverifikasi. */
it("memuat detail yang sah", async function ownedRequest() {
	mocks.request.mockResolvedValue({ id });
	expect((await loadParticipantRequest(id)).kind).toBe("ready");
	expect(mocks.documents).toHaveBeenCalledWith({}, id);
	expect(mocks.events).toHaveBeenCalledWith({}, id);
});
/** Menampilkan booking aktual, bukan jam slot yang dapat berubah kemudian. */
it("mengutamakan waktu booking yang terkonfirmasi", function actualBooking() {
	const request = {
		slot: { starts_at: "old" },
		booking: { starts_at: "confirmed" },
	} as ParticipantRequest;
	expect(participantRequestSchedule(request)?.starts_at).toBe("confirmed");
});
