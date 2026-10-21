// TODO: Ulangi otorisasi mentor dengan sesi server nyata sebelum membuka aplikasi produksi.
import { expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import { profileCommand } from "../src/controllers/demo/profile-controller";
import { scheduleCommand } from "../src/controllers/demo/schedule-controller";
import { mentorCommand } from "../src/controllers/demo/mentor-controller";

/** Memastikan mentor hanya mengubah profil dan jadwal yang terhubung ke akunnya. */
it("menolak perubahan jadwal mentor lain dan jam global", function mentorOwnership() {
	const state = createDemoSeed();
	state.userId = "user-mentor-1";
	profileCommand(state, "profile.save", {
		title: "UX Researcher",
		id: "mentor-2",
	});
	expect(state.mentors[0].title).toBe("UX Researcher");
	expect(state.mentors[1].title).not.toBe("UX Researcher");
	/** Mencoba menonaktifkan slot mentor yang bukan pemilik sesi. */
	function foreignSchedule() {
		scheduleCommand(state, "schedule.toggle", {
			mentorId: "mentor-2",
			date: "2026-10-24",
			id: "mentor-2-2026-10-24-18:30",
		});
	}
	expect(foreignSchedule).toThrow("milikmu");
	/** Mencoba mengubah pengaturan yang hanya diperuntukkan bagi admin. */
	function globalSettings() {
		scheduleCommand(state, "schedule.settings", {
			start: "19:00",
			end: "21:00",
			sessionMinutes: 15,
			bufferMinutes: 5,
		});
	}
	expect(globalSettings).toThrow("administrator");
});

/** Memastikan arsip mentor terblokir saat masih ada pengajuan aktif. */
it("melindungi mentor aktif dan mempertahankan foto saat payload invalid", function archiveProtection() {
	const state = createDemoSeed();
	state.userId = "admin";
	/** Mencoba mengarsipkan mentor yang masih harus menanggapi pengajuan. */
	function archiveBusyMentor() {
		mentorCommand(state, "mentor.archive", { id: "mentor-1" });
	}
	expect(archiveBusyMentor).toThrow("aktif");
	expect(state.mentors[0].archived).toBe(false);
	state.userId = "user-mentor-1";
	state.mentors[0].photo = "foto-sebelumnya";
	/** Mencoba menimpa foto dengan skema yang bukan data gambar yang diizinkan. */
	function unsafePhoto() {
		profileCommand(state, "profile.photo", { photo: "javascript:alert(1)" });
	}
	expect(unsafePhoto).toThrow("foto");
	expect(state.mentors[0].photo).toBe("foto-sebelumnya");
});
