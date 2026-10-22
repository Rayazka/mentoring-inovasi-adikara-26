// TODO: Tambahkan pembuktian RLS setelah daftar pengajuan dibaca dari database produksi.
import { expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import { participantRequestsData } from "../src/controllers/demo/participant-requests-controller";

/** Memastikan riwayat dan statistik tidak memasukkan pengajuan tim lain atau sesi pengguna tanpa tim. */
it("membatasi kartu dan statistik pada tim peserta yang sedang masuk", function listOwnership() {
	const state = createDemoSeed();
	state.requests.push({
		...state.requests[0],
		id: "PRIVATE-OTHER",
		teamId: "team-2",
		status: "completed",
	});
	const data = participantRequestsData(state, state.users[0]);
	expect(
		data.requests.map(
			/** Mengambil identitas pengajuan yang dapat dilihat peserta. */
			function requestId(item) {
				return item.id;
			},
		),
	).toEqual(["MT-026"]);
	expect(data.active).toHaveLength(1);
	expect(data.history).toHaveLength(0);
	const outsider = state.users.find(
		/** Memilih akun fixture yang belum menjadi anggota tim. */
		function withoutTeam(user) {
			return user.id === "sinta";
		},
	);
	if (!outsider) throw new Error("Fixture peserta tanpa tim tidak ditemukan.");
	expect(participantRequestsData(state, outsider).requests).toHaveLength(0);
});
