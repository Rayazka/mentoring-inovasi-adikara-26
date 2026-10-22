// TODO: Lengkapi verifikasi visual delapan keadaan Home melalui akun staging lintas perangkat.
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Menyiapkan sumber data Home tanpa fixtures yang akan dipublikasikan sebagai data operasional. */
	function setup() {
		return {
			session: vi.fn(),
			team: vi.fn(),
			members: vi.fn(),
			joins: vi.fn(),
			work: vi.fn(),
			documents: vi.fn(),
			requests: vi.fn(),
			resources: vi.fn(),
			settings: vi.fn(),
			catalog: vi.fn(),
		};
	},
);
vi.mock(
	"server-only",
	/** Mengizinkan controller server pada unit test. */ function serverOnly() {
		return {};
	},
);
vi.mock(
	"@/lib/auth/session",
	/** Menyediakan identitas sesi yang sudah diverifikasi. */ function session() {
		return { requireSession: mocks.session };
	},
);
vi.mock(
	"@/models/connected/team-repository",
	/** Mengendalikan keadaan tim dan kepemimpinan. */ function team() {
		return {
			readParticipantTeam: mocks.team,
			readTeamMembers: mocks.members,
			readIncomingJoins: mocks.joins,
		};
	},
);
vi.mock(
	"@/models/connected/work-repository",
	/** Mengendalikan draf dan karya lengkap. */ function work() {
		return { readTeamWork: mocks.work };
	},
);
vi.mock(
	"@/models/connected/document-repository",
	/** Mengendalikan metadata file dan link yang tersedia. */ function documents() {
		return { readWorkDocuments: mocks.documents };
	},
);
vi.mock(
	"@/models/connected/home-repository",
	/** Mengendalikan sesi utama dan tautan penting. */ function home() {
		return {
			readHomeRequests: mocks.requests,
			readHomeResources: mocks.resources,
		};
	},
);
vi.mock(
	"@/models/connected/mentor-repository",
	/** Mengendalikan pengaturan dan profil katalog aktual. */ function mentor() {
		return {
			readEventSettings: mocks.settings,
			readMentorCatalog: mocks.catalog,
		};
	},
);
import { loadParticipantHome } from "../src/controllers/connected/participant-home";

/** Menyiapkan peserta tanpa tim dengan pengaturan yang berasal dari database. */
beforeEach(function reset() {
	vi.clearAllMocks();
	mocks.session.mockResolvedValue({
		user: { id: "participant" },
		profile: { full_name: "Peserta Uji" },
		supabase: {},
	});
	mocks.team.mockResolvedValue(null);
	mocks.settings.mockResolvedValue({
		dates: ["2026-10-24"],
		day_start: "18:30:00",
		day_end: "22:00:00",
		session_minutes: 15,
		buffer_minutes: 5,
		discord_url: "https://discord.gg/example",
	});
	mocks.catalog.mockResolvedValue({ mentors: [] });
	mocks.resources.mockResolvedValue([]);
	mocks.members.mockResolvedValue([
		{ user_id: "participant", full_name: "Peserta Uji" },
	]);
	mocks.joins.mockResolvedValue([]);
	mocks.work.mockResolvedValue(null);
	mocks.documents.mockResolvedValue([]);
	mocks.requests.mockResolvedValue({ request: null, attention: "" });
});
/** Menjaga container kosong tanpa mengarang tim, mentor, slot atau progres. */
it("memuat Home tanpa tim", async function noTeam() {
	const result = await loadParticipantHome();
	expect(result.error).toBe(false);
	expect(result.data?.team).toBeNull();
	expect(result.data?.request).toBeNull();
	expect(result.data?.ready).toBe(false);
	expect(mocks.documents).not.toHaveBeenCalled();
});
/** Tidak menganggap karya lengkap hanya karena judul atau dokumen sudah tersedia. */
it("mempertahankan draf sebagai belum siap", async function draft() {
	mocks.team.mockResolvedValue({
		id: "team",
		leader_id: "participant",
		name: "Tim Uji",
	});
	mocks.work.mockResolvedValue({
		title: "Judul",
		description: "Deskripsi",
		is_draft: true,
	});
	mocks.documents.mockResolvedValue([
		{ kind: "file", ready: false },
		{ kind: "drive", ready: true },
	]);
	const result = await loadParticipantHome();
	expect(result.data?.ready).toBe(false);
	expect(result.data?.files).toBe(0);
	expect(result.data?.links).toBe(1);
});
/** Menggunakan jam booking terkini dan menyembunyikan meeting pada status selain approved. */
it("memetakan waktu WIB dan hak tautan meeting", async function confirmedSchedule() {
	mocks.team.mockResolvedValue({
		id: "team",
		leader_id: "participant",
		name: "Tim Uji",
	});
	mocks.requests.mockResolvedValue({
		request: {
			id: "request",
			code: "MT-000001",
			status: "pending",
			title_snapshot: "Judul",
			meeting_url: "https://meet.example",
			booking: {
				starts_at: "2026-10-24T11:30:00Z",
				ends_at: "2026-10-24T11:45:00Z",
			},
		},
		attention: "",
	});
	const result = await loadParticipantHome();
	expect(result.data?.slot).toEqual({
		date: "2026-10-24",
		start: "18:30",
		end: "18:45",
	});
	expect(result.data?.request?.meetingUrl).toBe("");
});
/** Membedakan kegagalan kueri dari kondisi tim yang belum dibuat. */
it("tidak menyamarkan error menjadi data kosong", async function failedRead() {
	mocks.team.mockRejectedValue(new Error("network"));
	const result = await loadParticipantHome();
	expect(result.error).toBe(true);
	expect(result.data).toBeNull();
});
