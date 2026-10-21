// TODO: Pertahankan cakupan keadaan Home V2 saat aturan tim dan kesiapan karya berubah.
import { expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import { participantHomeData } from "../src/controllers/demo/home-controller";

/** Memastikan peserta baru tidak melihat waktu atau karya milik tim lain pada Home. */
it("menampilkan Home kosong tanpa sesi rekaan", function emptyHome() {
	const state = createDemoSeed();
	const user = state.users.find(
		/** Memilih peserta contoh yang belum menjadi anggota tim. */
		function newParticipant(item) {
			return item.id === "sinta";
		},
	);
	if (!user) throw new Error("Fixture peserta tidak tersedia.");
	const home = participantHomeData(state, user);
	expect(home.team).toBeUndefined();
	expect(home.request).toBeUndefined();
	expect(home.slot).toBeUndefined();
	expect(home.files).toBe(0);
	expect(home.ready).toBe(false);
});

/** Memastikan draf dan pengajuan menunggu tidak dianggap sebagai karya lengkap atau sesi disetujui. */
it("menurunkan kondisi Home dari data tersimpan", function homeState() {
	const state = createDemoSeed();
	const actor = state.users[0];
	const pending = participantHomeData(state, actor);
	expect(pending.request?.status).toBe("pending");
	expect(pending.leader).toBe(true);
	state.works[0].description = "";
	expect(participantHomeData(state, actor).ready).toBe(false);
	state.teams[0].memberIds = ["rafi"];
	expect(participantHomeData(state, actor).request).toBeUndefined();
});
