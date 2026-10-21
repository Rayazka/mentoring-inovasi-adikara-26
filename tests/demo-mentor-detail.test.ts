// TODO: Ulangi perubahan slot melalui koneksi server saat jadwal produksi terhubung.
import { expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import { mentorDetailData } from "../src/controllers/demo/mentor-detail-controller";

/** Memastikan CTA menjelaskan batas pengajuan tanpa menghalangi peserta menjelajahi jadwal. */
it("menjelaskan pembatasan pengajuan dan membatalkan pilihan slot yang dinonaktifkan", function detailSelection() {
	const state = createDemoSeed();
	const actor = state.users[0];
	const mentor = state.mentors[0];
	const slot = state.slots[0];
	const data = mentorDetailData(state, actor, mentor, slot.date, slot.id);
	expect(data.restriction).toContain("menunggu");
	expect(data.selected?.id).toBe(slot.id);
	slot.enabled = false;
	expect(
		mentorDetailData(state, actor, mentor, slot.date, slot.id).selected,
	).toBeUndefined();
});
