// TODO: Pindahkan keputusan dan penguncian slot ke transaksi database agar aman lintas perangkat.
import type { DemoState, MentoringRequest } from "@/models/demo/types";
import {
	availableRequestSlot,
	requestForActor,
	transitionRequest,
} from "@/models/demo/request-policy";
import { mentorForUser } from "@/models/demo/mentor-policy";
import { slotsOverlap } from "@/models/demo/slot-policy";
import {
	audit,
	notify,
	requestEvent,
	requireActor,
	requiredText,
	safeUrl,
} from "./context";
import { textValue, type CommandPayload } from "./session-controller";

/** Memberi tahu anggota aktif tim ketika keputusan atau perubahan pengajuan tersimpan. */
export function notifyRequestTeam(
	state: DemoState,
	request: MentoringRequest,
	message: string,
) {
	const team = state.teams.find(
		/** Menentukan anggota tim yang masih memiliki akses pada saat notifikasi dibuat. */
		function recipientTeam(item) {
			return item.id === request.teamId;
		},
	);
	for (const userId of team?.memberIds ?? [])
		notify(state, userId, message, `/peserta/pengajuan/${request.id}`);
}

/** Menanggapi pengajuan dengan validasi peran, status, meeting URL dan konflik reservasi terbaru. */
export function reviewCommand(
	state: DemoState,
	action: string,
	payload: CommandPayload,
) {
	const actor = requireActor(state);
	const request = requestForActor(state, textValue(payload, "id"));
	if (mentorForUser(state, actor.id)?.id !== request.mentorId)
		throw new Error("Hanya mentor terkait yang dapat memberi keputusan.");
	if (!["pending", "revision_requested"].includes(request.status))
		throw new Error("Pengajuan sudah diproses. Keputusan tidak dapat diulang.");
	const note = typeof payload.note === "string" ? payload.note.trim() : "";
	if (action === "review.approve") {
		if (request.status !== "pending")
			throw new Error(
				"Tunggu tim mengirim ulang perbaikan sebelum menyetujui.",
			);
		const url = safeUrl(textValue(payload, "meetingUrl"));
		const slot = availableRequestSlot(
			state,
			request.slotId,
			request.mentorId,
			request.id,
		);
		if (
			state.requests.some(
				/** Menolak sesi tim yang waktunya bertabrakan meskipun mentornya berbeda. */
				function teamConflict(other) {
					if (
						other.id === request.id ||
						other.teamId !== request.teamId ||
						other.status !== "approved"
					)
						return false;
					const booked = state.slots.find(
						/** Mengambil rentang sesi lain milik tim untuk pemeriksaan waktu. */
						function teamBooking(item) {
							return item.id === other.slotId;
						},
					);
					return (
						booked &&
						booked.date === slot.date &&
						booked.start < slot.bufferEnd &&
						slot.start < booked.bufferEnd
					);
				},
			)
		)
			throw new Error(
				"Tim memiliki sesi lain yang bertabrakan pada waktu tersebut.",
			);
		transitionRequest(request, "approved");
		request.meetingUrl = url;
		request.note = note;
		requestEvent(
			state,
			request,
			"Pengajuan disetujui",
			note || "Jadwal terkunci dan ruang mentoring tersedia.",
		);
		for (const other of state.requests) {
			if (other.id === request.id || other.status !== "pending") continue;
			const competingSlot = state.slots.find(
				/** Mengambil slot permintaan lain untuk mendeteksi siapa yang kehilangan jadwal. */
				function competing(item) {
					return item.id === other.slotId;
				},
			);
			if (!competingSlot || !slotsOverlap(competingSlot, slot)) continue;
			transitionRequest(other, "revision_requested");
			other.revisionKind = "schedule";
			other.note =
				"Jadwal sudah disetujui untuk tim lain. Silakan pilih slot pengganti.";
			requestEvent(state, other, "Perlu jadwal pengganti", other.note);
			notifyRequestTeam(
				state,
				other,
				"Jadwal terpilih terbooking tim lain. Pilih pengganti.",
			);
		}
		notifyRequestTeam(
			state,
			request,
			"Pengajuan disetujui. Ruang mentoring sudah tersedia.",
		);
	} else if (action === "review.reject") {
		request.note = requiredText(note, "Alasan penolakan", 2000);
		transitionRequest(request, "rejected");
		requestEvent(state, request, "Pengajuan ditolak", request.note);
		notifyRequestTeam(
			state,
			request,
			"Mentor menolak pengajuan. Baca alasan pada detail.",
		);
	} else if (action === "review.revise") {
		if (request.status !== "pending")
			throw new Error("Pengajuan ini sudah menunggu revisi tim.");
		const kind = textValue(payload, "kind");
		if (kind !== "work" && kind !== "schedule" && kind !== "both")
			throw new Error("Pilih jenis revisi yang valid.");
		request.note = requiredText(note, "Catatan revisi", 2000);
		request.revisionKind = kind;
		transitionRequest(request, "revision_requested");
		requestEvent(state, request, "Mentor meminta revisi", request.note);
		notifyRequestTeam(
			state,
			request,
			"Ada catatan revisi dari mentor. Periksa pengajuan timmu.",
		);
	} else throw new Error("Keputusan tidak dikenal.");
	audit(state, "Keputusan pengajuan", request.id, action);
	return "Respons tersimpan dan notifikasi dikirim kepada tim.";
}
