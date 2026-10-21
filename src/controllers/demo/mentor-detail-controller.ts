// TODO: Hubungkan ringkasan pemilihan jadwal ke proyeksi server saat integrasi produksi tersedia.
import type { DemoState, DemoUser, Mentor } from "@/models/demo/types";
import { teamForUser, workIsReady } from "@/models/demo/selectors";
import { slotIsBooked } from "@/models/demo/slot-policy";
import { assertRequestCapacity } from "@/models/demo/request-policy";

/** Menyiapkan slot dan alasan pembatasan CTA dari aturan domain yang juga dipakai saat submit. */
export function mentorDetailData(
	state: DemoState,
	actor: DemoUser,
	mentor: Mentor,
	date: string,
	slotId: string,
) {
	const team = teamForUser(state, actor.id);
	const ready = Boolean(team && workIsReady(state, team.id));
	const leader = team?.leaderId === actor.id;
	let restriction = !team
		? "Buat atau bergabung dengan tim untuk mengajukan mentoring."
		: !ready
			? "Lengkapi judul dan deskripsi Identitas Karya terlebih dahulu."
			: !leader
				? "Pengajuan mentoring dikirim oleh ketua tim."
				: "";
	if (team && !restriction) {
		try {
			assertRequestCapacity(state, team.id);
		} catch (cause) {
			restriction =
				cause instanceof Error
					? cause.message
					: "Pengajuan belum dapat dilanjutkan.";
		}
	}
	const slots = state.slots
		.filter(
			/** Membatasi jadwal pada mentor dan hari yang sedang ditinjau. */
			function matchingSlot(slot) {
				return slot.mentorId === mentor.id && slot.date === date;
			},
		)
		.sort(
			/** Mengurutkan waktu mulai agar slot mudah dipindai. */
			function chronological(a, b) {
				return a.start.localeCompare(b.start);
			},
		)
		.map(
			/** Menandai slot berdasarkan booking, aktivasi dan waktu aktual. */
			function slotState(slot) {
				const booked = slotIsBooked(state, slot.id);
				const past =
					new Date(`${slot.date}T${slot.start}:00+07:00`).getTime() <=
					Date.now();
				return {
					...slot,
					disabled: booked || past || !slot.enabled,
					label: booked
						? "Terpesan"
						: past
							? "Sudah lewat"
							: !slot.enabled
								? "Tidak tersedia"
								: "Tersedia",
				};
			},
		);
	const selected = slots.find(
		/** Membatalkan pilihan secara efektif ketika slot berubah menjadi tidak tersedia. */
		function validSelection(slot) {
			return slot.id === slotId && !slot.disabled;
		},
	);
	return { team, ready, leader, restriction, slots, selected };
}
