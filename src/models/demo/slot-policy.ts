// TODO: Terapkan pemeriksaan benturan menggunakan constraint database pada booking produksi.
import { generateSlots, type ScheduleSettings } from "@/lib/mentoring/schedule";
import type { DemoState, Slot } from "./types";

/** Memeriksa reservasi yang masih menggunakan slot dan harus dilindungi saat pembentukan jadwal. */
export function slotIsBooked(
	state: DemoState,
	slotId: string,
	exceptRequestId = "",
) {
	return state.requests.some(
		/** Mengabaikan pengajuan pemilik saat menilai perpindahan jadwalnya sendiri. */
		function reservation(request) {
			return (
				request.id !== exceptRequestId &&
				request.slotId === slotId &&
				["approved", "completed"].includes(request.status)
			);
		},
	);
}

/** Menilai benturan termasuk seluruh waktu jeda pada mentor dan tanggal yang sama. */
export function slotsOverlap(first: Slot, second: Slot) {
	return (
		first.mentorId === second.mentorId &&
		first.date === second.date &&
		first.start < second.bufferEnd &&
		second.start < first.bufferEnd
	);
}

/** Membentuk slot lengkap sambil mempertahankan durasi dan identitas booking bersejarah. */
export function rebuildMentorSlots(
	state: DemoState,
	mentorId: string,
	date: string,
	settings: ScheduleSettings,
) {
	const mentor = state.mentors.find(
		/** Memastikan jadwal hanya dibuat untuk profil mentor yang dikenal. */
		function scheduleMentor(item) {
			return item.id === mentorId;
		},
	);
	if (!mentor || mentor.archived || !mentor.dates.includes(date))
		throw new Error("Mentor tidak tersedia pada tanggal tersebut.");
	const generated: Slot[] = generateSlots(settings).map(
		/** Membentuk identitas slot tetap dari mentor, tanggal dan waktu mulai WIB. */
		function slotCandidate(slot) {
			return {
				id: `${mentorId}-${date}-${slot.start}`,
				mentorId,
				date,
				start: slot.start,
				end: slot.sessionEnd,
				bufferEnd: slot.bufferEnd,
				enabled: true,
			};
		},
	);
	if (!generated.length)
		throw new Error(
			"Rentang waktu harus cukup untuk setidaknya satu sesi dan jeda penuh.",
		);
	const retained = state.slots.filter(
		/** Menjaga slot milik hari lain serta slot yang masih direferensikan riwayat. */
		function retainedSlot(slot) {
			return (
				slot.mentorId !== mentorId ||
				slot.date !== date ||
				state.requests.some(
					/** Menemukan referensi slot pada pengajuan dan usulan perubahan. */
					function referenced(request) {
						return (
							request.slotId === slot.id ||
							request.change?.slotId === slot.id ||
							request.proposedSlotId === slot.id
						);
					},
				)
			);
		},
	);
	for (const slot of retained) {
		if (
			slot.mentorId !== mentorId ||
			slot.date !== date ||
			slotIsBooked(state, slot.id)
		)
			continue;
		slot.enabled = generated.some(
			/** Mengaktifkan slot lama hanya jika durasinya masih sesuai dengan konfigurasi baru. */
			function unchanged(candidate) {
				return (
					candidate.id === slot.id &&
					candidate.end === slot.end &&
					candidate.bufferEnd === slot.bufferEnd
				);
			},
		);
	}
	const created = generated.filter(
		/** Menghindari ID ganda dan benturan dengan booking yang dipertahankan. */
		function safeCandidate(candidate) {
			return !retained.some(
				/** Menolak kandidat yang mengganti identitas lama atau bertabrakan dengan reservasi. */
				function conflict(slot) {
					return (
						slot.id === candidate.id ||
						(slotIsBooked(state, slot.id) && slotsOverlap(slot, candidate))
					);
				},
			);
		},
	);
	state.slots = [...retained, ...created];
}
