// TODO: Gunakan constraint benturan dan transaksi booking yang sama pada endpoint jadwal produksi.
import { generateSlots } from "@/lib/mentoring/schedule";
import type { DemoState, Slot } from "@/models/demo/types";
import {
	rebuildMentorSlots,
	slotIsBooked,
	slotsOverlap,
} from "@/models/demo/slot-policy";
import {
	audit,
	notify,
	requestEvent,
	requireAdmin,
	requireActor,
} from "./context";
import { mentorForUser } from "@/models/demo/mentor-policy";
import { textValue, type CommandPayload } from "./session-controller";

/** Mengarahkan pengajuan ke revisi saat slot yang diminta dinonaktifkan tanpa mengubah booking terkonfirmasi. */
function reconcileRequests(state: DemoState) {
	for (const request of state.requests) {
		if (!["pending", "revision_requested"].includes(request.status)) continue;
		const slot = state.slots.find(
			/** Memeriksa slot terbaru yang dirujuk pengajuan. */
			function requestedSlot(item) {
				return item.id === request.slotId;
			},
		);
		if (slot?.enabled) continue;
		request.status = "revision_requested";
		request.revisionKind = "schedule";
		request.note = "Jadwal tersedia berubah. Silakan pilih slot pengganti.";
		requestEvent(state, request, "Jadwal perlu diperbarui", request.note);
		const team = state.teams.find(
			/** Menemukan ketua tim untuk pemberitahuan perubahan slot. */
			function requestTeam(item) {
				return item.id === request.teamId;
			},
		);
		if (team)
			notify(
				state,
				team.leaderId,
				`Pilih jadwal baru untuk ${request.id}`,
				"/peserta/pengajuan",
			);
	}
}

/** Mengubah pengaturan operasional dan slot mentor tanpa memindahkan reservasi yang sudah disetujui. */
export function scheduleCommand(
	state: DemoState,
	action: string,
	payload: CommandPayload,
) {
	const actor = requireActor(state);
	if (action === "schedule.settings") {
		requireAdmin(state);
		const settings = {
			start: textValue(payload, "start"),
			end: textValue(payload, "end"),
			sessionMinutes: Number(payload.sessionMinutes),
			bufferMinutes: Number(payload.bufferMinutes),
		};
		if (!generateSlots(settings).length)
			throw new Error("Rentang jam belum cukup untuk satu sesi lengkap.");
		Object.assign(state.settings, settings);
		audit(
			state,
			"Jam operasional diperbarui",
			"settings",
			`${settings.start}–${settings.end} WIB`,
		);
		return "Pengaturan default disimpan. Terapkan melalui pembentukan slot per mentor; booking lama tetap terlindungi.";
	}
	const mentorId = textValue(payload, "mentorId");
	if (actor.role !== "admin" && mentorForUser(state, actor.id)?.id !== mentorId)
		throw new Error("Kamu hanya dapat mengelola jadwal mentor milikmu.");
	const mentor = state.mentors.find(
		/** Memilih profil mentor yang dikelola administrator. */
		function schedulingMentor(item) {
			return item.id === mentorId && !item.archived;
		},
	);
	if (!mentor) throw new Error("Mentor tidak ditemukan.");
	const date = textValue(payload, "date");
	if (!mentor.dates.includes(date))
		throw new Error("Tanggal tidak termasuk ketersediaan mentor.");
	if (action === "schedule.generate") {
		if (
			new Date(`${date}T${state.settings.end}:00+07:00`).getTime() <= Date.now()
		)
			throw new Error(
				"Tidak dapat membentuk jadwal pada hari yang telah berakhir.",
			);
		rebuildMentorSlots(state, mentorId, date, state.settings);
	} else {
		const id = typeof payload.id === "string" ? payload.id : "";
		const current = state.slots.find(
			/** Membatasi target slot pada mentor dan tanggal yang dipilih. */
			function currentSlot(slot) {
				return (
					slot.id === id && slot.mentorId === mentorId && slot.date === date
				);
			},
		);
		if (id && !current) throw new Error("Slot tidak ditemukan.");
		if (current && slotIsBooked(state, current.id))
			throw new Error(
				"Slot sudah memiliki booking terkonfirmasi. Gunakan alur perubahan sesi.",
			);
		if (action === "schedule.toggle" && current) {
			if (
				!current.enabled &&
				state.slots.some(
					/** Mencegah aktivasi slot yang tumpang tindih dengan slot aktif lainnya. */
					function overlapping(slot) {
						return (
							slot.id !== current.id &&
							slot.enabled &&
							slotsOverlap(slot, current)
						);
					},
				)
			)
				throw new Error(
					"Slot bertabrakan dengan slot aktif lain termasuk waktu jeda.",
				);
			if (
				!current.enabled &&
				new Date(`${date}T${current.start}:00+07:00`).getTime() <= Date.now()
			)
				throw new Error("Slot lampau tidak dapat diaktifkan.");
			current.enabled = !current.enabled;
		} else if (action === "schedule.delete" && current) {
			if (
				state.requests.some(
					/** Menjaga referensi pengajuan pada slot yang pernah digunakan. */
					function usedSlot(request) {
						return (
							request.slotId === current.id ||
							request.change?.slotId === current.id
						);
					},
				)
			)
				throw new Error(
					"Slot sudah direferensikan pengajuan. Nonaktifkan agar riwayat tetap utuh.",
				);
			state.slots = state.slots.filter(
				/** Menghapus hanya slot kosong yang dipilih. */
				function remainingSlot(slot) {
					return slot.id !== current.id;
				},
			);
		} else if (action === "schedule.save") {
			const start = textValue(payload, "start");
			const first = generateSlots({ ...state.settings, start })[0];
			if (!first || start < state.settings.start)
				throw new Error(
					"Waktu mulai harus berada dalam jam operasional dan menyisakan jeda penuh.",
				);
			if (new Date(`${date}T${start}:00+07:00`).getTime() <= Date.now())
				throw new Error("Slot lampau tidak dapat ditambahkan.");
			if (
				current &&
				state.requests.some(
					/** Mencegah penyuntingan durasi dari slot yang sudah memiliki riwayat. */
					function referencedSlot(request) {
						return request.slotId === current.id;
					},
				)
			)
				throw new Error(
					"Slot memiliki riwayat. Nonaktifkan lalu buat slot baru.",
				);
			const next: Slot = {
				id: `${mentorId}-${date}-${start}`,
				mentorId,
				date,
				start,
				end: first.sessionEnd,
				bufferEnd: first.bufferEnd,
				enabled: true,
			};
			if (
				state.slots.some(
					/** Menolak identitas ganda maupun benturan jadwal dan waktu jeda. */
					function slotConflict(slot) {
						return (
							slot.id !== current?.id &&
							(slot.id === next.id ||
								(slot.enabled && slotsOverlap(slot, next)))
						);
					},
				)
			)
				throw new Error(
					"Jadwal tumpang tindih dengan slot lain termasuk jedanya.",
				);
			if (current) Object.assign(current, next);
			else state.slots.push(next);
		} else throw new Error("Tindakan slot tidak dikenali.");
	}
	reconcileRequests(state);
	audit(state, "Jadwal mentor diperbarui", mentorId, `${date} · ${action}`);
	return "Jadwal diperbarui. Booking terkonfirmasi dan riwayat tetap dipertahankan.";
}
