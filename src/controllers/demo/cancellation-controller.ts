// TODO: Jadikan batas pembatalan konfigurasi kebijakan produksi setelah keputusan pemilik difinalkan.
import type { DemoState } from "@/models/demo/types";
import {
	requestForActor,
	transitionRequest,
} from "@/models/demo/request-policy";
import {
	audit,
	notify,
	requestEvent,
	requireActor,
	requireLeader,
	requiredText,
} from "./context";
import { notifyRequestTeam } from "./review-controller";
import { textValue, type CommandPayload } from "./session-controller";

/** Membatalkan pengajuan atau sesi dengan alasan wajib dan batas demo 24 jam bagi ketua peserta. */
export function cancellationCommand(
	state: DemoState,
	action: string,
	payload: CommandPayload,
) {
	if (action !== "cancellation.cancel")
		throw new Error("Tindakan pembatalan tidak dikenal.");
	const actor = requireActor(state);
	const request = requestForActor(state, textValue(payload, "id"));
	if (!["pending", "revision_requested", "approved"].includes(request.status))
		throw new Error("Pengajuan sudah berakhir atau telah dibatalkan.");
	const note = requiredText(
		textValue(payload, "note"),
		"Alasan pembatalan",
		2000,
	);
	if (actor.role !== "admin") {
		if (actor.role !== "participant")
			throw new Error("Pembatalan dilakukan ketua tim atau admin darurat.");
		requireLeader(state, request.teamId);
		if (request.status === "approved") {
			const slot = state.slots.find(
				/** Menentukan waktu mulai sesi untuk batas pembatalan dalam WIB. */
				function sessionSlot(item) {
					return item.id === request.slotId;
				},
			);
			if (
				!slot ||
				new Date(`${slot.date}T${slot.start}:00+07:00`).getTime() - Date.now() <
					24 * 60 * 60 * 1000
			)
				throw new Error(
					"Aturan demo: pembatalan sesi terkonfirmasi paling lambat 24 jam sebelum mulai. Hubungi admin untuk keadaan darurat.",
				);
		}
	}
	transitionRequest(request, "cancelled");
	request.note = note;
	request.meetingUrl = "";
	delete request.change;
	requestEvent(
		state,
		request,
		actor.role === "admin"
			? "Pembatalan darurat admin"
			: "Dibatalkan ketua tim",
		note,
	);
	notifyRequestTeam(
		state,
		request,
		"Pengajuan mentoring dibatalkan. Periksa alasannya pada detail.",
	);
	const mentor = state.mentors.find(
		/** Menentukan akun mentor yang perlu menerima pemberitahuan pembatalan. */
		function sessionMentor(item) {
			return item.id === request.mentorId;
		},
	);
	if (mentor?.userId)
		notify(
			state,
			mentor.userId,
			"Pengajuan mentoring dibatalkan",
			`/mentor/pengajuan/${request.id}`,
		);
	audit(
		state,
		actor.role === "admin" ? "Pembatalan darurat" : "Pembatalan peserta",
		request.id,
		note,
	);
	return "Pembatalan tersimpan dan slot reservasi dilepas.";
}
