// TODO: Jalankan kontrak karya yang sama pada adapter database ketika tersedia.
import { expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import { workCommand } from "../src/controllers/demo/work-controller";
import { canReadTeam, workIsReady } from "../src/models/demo/selectors";

/** Memastikan draf parsial belum dianggap siap dan karya lengkap dapat dipakai ulang. */
it("membedakan draf dan identitas karya lengkap", function draftCompleteness() {
	const state = createDemoSeed();
	state.userId = "alya";
	workCommand(state, "work.draft", { title: "Ide baru", description: "" });
	expect(workIsReady(state, "team-1")).toBe(false);
	/** Menguji validasi saat deskripsi yang diwajibkan masih kosong. */
	function incompleteSave() {
		workCommand(state, "work.save", { title: "Ide", description: "" });
	}
	expect(incompleteSave).toThrow("Deskripsi");
	workCommand(state, "work.save", {
		title: "Ide baru",
		description: "Gambaran solusi",
	});
	expect(workIsReady(state, "team-1")).toBe(true);
});

/** Membuktikan peserta tanpa tim dan mantan anggota tidak mendapatkan akses karya tim lama. */
it("membatasi karya pada anggota aktif", function membershipAccess() {
	const state = createDemoSeed();
	state.userId = "sinta";
	/** Mencoba menyimpan karya sebelum menjadi anggota tim. */
	function saveWithoutTeam() {
		workCommand(state, "work.save", { title: "Ide", description: "Solusi" });
	}
	expect(saveWithoutTeam).toThrow("Bergabung");
	const user = state.users[0];
	expect(canReadTeam(state, user, "team-1")).toBe(true);
	state.teams[0].memberIds = ["rafi"];
	expect(canReadTeam(state, user, "team-1")).toBe(false);
});
