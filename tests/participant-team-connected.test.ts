// TODO: Lengkapi UAT lintas akun pada deployment selain pengujian batas controller ini.
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Menyiapkan sesi dan RPC terpisah dari kredensial produksi. */
	function setup() {
		return { session: vi.fn(), rpc: vi.fn(), revalidate: vi.fn() };
	},
);
vi.mock(
	"server-only",
	/** Mengizinkan impor controller server dalam runner unit. */ function serverOnly() {
		return {};
	},
);
vi.mock(
	"@/lib/auth/session",
	/** Mengisolasi pemeriksaan sesi untuk menguji penolakan sebelum mutasi. */ function session() {
		return { requireSession: mocks.session };
	},
);
vi.mock(
	"next/cache",
	/** Merekam invalidasi halaman setelah transaksi berhasil. */ function cache() {
		return { revalidatePath: mocks.revalidate };
	},
);
import {
	createParticipantTeam,
	requestParticipantJoin,
} from "../src/controllers/connected/team-actions";
import {
	createTeamInput,
	teamMutationError,
} from "../src/models/connected/team";

/** Menyiapkan peserta dengan client yang tidak memiliki service role. */
beforeEach(function reset() {
	vi.clearAllMocks();
	mocks.session.mockResolvedValue({
		user: { id: "participant" },
		supabase: { rpc: mocks.rpc },
	});
	mocks.rpc.mockResolvedValue({ error: null, data: "team" });
});
/** Menolak input tidak valid sebelum menyentuh RPC. */
it("menolak kategori di luar domain", async function invalidCategory() {
	const form = new FormData();
	form.set("name", "Tim A");
	form.set("category", "admin");
	form.set("description", "");
	expect(
		(await createParticipantTeam({ error: null }, form)).error,
	).toBeTruthy();
	expect(mocks.rpc).not.toHaveBeenCalled();
});
/** Memastikan pemilik tim berasal dari sesi database, bukan input tersembunyi pengguna. */
it("membuat tim lewat transaksi tanpa menerima pemilik dari browser", async function createTeam() {
	const form = new FormData();
	form.set("name", " Tim A ");
	form.set("category", "IoT");
	form.set("description", "Fokus sensor");
	form.set("owner", "victim");
	expect((await createParticipantTeam({ error: null }, form)).error).toBeNull();
	expect(mocks.session).toHaveBeenCalledWith(["participant"]);
	expect(mocks.rpc).toHaveBeenCalledWith("create_team", {
		p_name: "Tim A",
		p_category: "IoT",
		p_description: "Fokus sensor",
	});
	expect(mocks.revalidate).toHaveBeenCalledWith("/peserta", "layout");
});
/** Menahan permintaan saat sesi ditolak sebelum client database tersedia. */
it("menolak sesi staf atau tanpa autentikasi", async function unauthorized() {
	mocks.session.mockRejectedValue(new Error("REDIRECT"));
	await expect(
		requestParticipantJoin({ error: null }, new FormData()),
	).rejects.toThrow("REDIRECT");
	expect(mocks.rpc).not.toHaveBeenCalled();
});
/** Memastikan permintaan bergabung tidak berubah menjadi penambahan anggota langsung. */
it("mengirim join sebagai permintaan dan mempertahankan pesan kapasitas", async function joinFull() {
	mocks.rpc.mockResolvedValue({
		error: { code: "P0001", message: "Tim penuh." },
	});
	const form = new FormData();
	form.set("team", "11111111-1111-4111-8111-111111111111");
	form.set("note", "Saya ingin membantu");
	expect((await requestParticipantJoin({ error: null }, form)).error).toBe(
		"Tim penuh.",
	);
	expect(mocks.rpc).toHaveBeenCalledWith("request_team_join", {
		p_team: "11111111-1111-4111-8111-111111111111",
		p_note: "Saya ingin membantu",
	});
	expect(mocks.revalidate).not.toHaveBeenCalled();
});
/** Mencegah bocornya detail kesalahan penyimpanan kepada peserta. */
it("mengubah kegagalan menjadi pesan aman", function safeErrors() {
	expect(teamMutationError("XX000", "secret SQL context")).not.toContain(
		"secret",
	);
	expect(teamMutationError("23505")).toContain("sudah ada");
	expect(
		createTeamInput.safeParse({ name: " ", category: "IoT", description: "" })
			.success,
	).toBe(false);
});
