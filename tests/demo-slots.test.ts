// TODO: Tambahkan uji race dua koneksi saat pembentukan jadwal memakai database produksi.
import { expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import {
	rebuildMentorSlots,
	slotsOverlap,
} from "../src/models/demo/slot-policy";
import { defaultSchedule } from "../src/lib/mentoring/schedule";

/** Memastikan pembentukan ulang tidak mengubah durasi booking dan tetap menghitung jeda. */
it("mempertahankan booking dan tidak menghasilkan benturan termasuk buffer", function preserveReservation() {
	const state = createDemoSeed();
	state.requests[0].status = "approved";
	const booked = structuredClone(state.slots[1]);
	rebuildMentorSlots(state, "mentor-1", "2026-10-24", {
		...defaultSchedule,
		start: "18:40",
		sessionMinutes: 25,
	});
	expect(
		state.slots.find(
			/** Mengambil slot booking lama untuk memeriksa durasinya. */
			function oldBooking(slot) {
				return slot.id === state.requests[0].slotId;
			},
		),
	).toEqual(booked);
	const others = state.slots.filter(
		/** Mengambil kandidat baru pada hari dan mentor booking lama. */
		function otherSlots(slot) {
			return (
				slot.mentorId === booked.mentorId &&
				slot.date === booked.date &&
				slot.id !== booked.id &&
				slot.enabled
			);
		},
	);
	for (const slot of others) expect(slotsOverlap(booked, slot)).toBe(false);
});

/** Memastikan mentor dengan satu hari ketersediaan tidak mendapat slot pada hari lain. */
it("mematuhi hari tersedia mentor", function restrictedDate() {
	const state = createDemoSeed();
	/** Mencoba membuat slot pada hari yang tidak tercantum di profil mentor. */
	function unavailableDay() {
		rebuildMentorSlots(state, "mentor-3", "2026-10-25", defaultSchedule);
	}
	expect(unavailableDay).toThrow("tidak tersedia");
});
