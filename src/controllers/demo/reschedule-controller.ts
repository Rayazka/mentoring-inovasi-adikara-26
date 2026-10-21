// TODO: Gunakan transaksi perpindahan slot agar booking lama dan baru konsisten lintas perangkat.
import type { DemoState } from "@/models/demo/types";
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
	requireLeader,
	requiredText,
} from "./context";
import { notifyRequestTeam } from "./review-controller";
import { textValue, type CommandPayload } from "./session-controller";

/** Mengusulkan atau menyepakati perpindahan sesi approved tanpa melepas jadwal lama sebelum berhasil. */
export function rescheduleCommand(
	state: DemoState,
	action: string,
	payload: CommandPayload,
) {
	const actor = requireActor(state);
	const request = requestForActor(state, textValue(payload, "id"));
	if (actor.role === "participant") requireLeader(state, request.teamId);
	else if (mentorForUser(state, actor.id)?.id !== request.mentorId)
		throw new Error(
			"Hanya ketua tim atau mentor terkait yang dapat mengubah jadwal sesi.",
		);
	if (request.status !== "approved")
		throw new Error(
			"Usulan perubahan hanya tersedia untuk sesi yang sudah disetujui.",
		);
	const oldSlot = state.slots.find(
		/** Mengambil booking aktif yang harus tetap dipertahankan sampai perpindahan disepakati. */
		function oldBooking(slot) {
			return slot.id === request.slotId;
		},
	);
	if (
		!oldSlot ||
		new Date(`${oldSlot.date}T${oldSlot.start}:00+07:00`).getTime() <=
			Date.now()
	)
		throw new Error(
			"Sesi sudah dimulai atau jadwal lama tidak ditemukan. Hubungi admin.",
		);
	if (action === "reschedule.propose") {
		if (request.change)
			throw new Error("Usulan sebelumnya masih menunggu keputusan.");
		const slotId = textValue(payload, "slotId");
		if (slotId === request.slotId)
			throw new Error("Pilih jadwal yang berbeda dari booking saat ini.");
		availableRequestSlot(state, slotId, request.mentorId, request.id);
		const note = requiredText(
			textValue(payload, "note"),
			"Alasan perubahan",
			2000,
		);
		request.change = { slotId, note, authorId: actor.id, accepted: false };
		requestEvent(state, request, "Perubahan jadwal diusulkan", note);
	} else if (action === "reschedule.respond") {
		if (!request.change || request.change.authorId === actor.id)
			throw new Error("Usulan tidak ditemukan atau kamu adalah pembuatnya.");
		const author = state.users.find(
			/** Menentukan pihak pengusul agar hanya pihak lawan yang dapat menyepakati perubahan. */
			function proposalAuthor(user) {
				return user.id === request.change?.authorId;
			},
		);
		if (author?.role === actor.role)
			throw new Error("Perubahan harus disepakati oleh tim dan mentor.");
		if (payload.accept === true) {
			const next = availableRequestSlot(
				state,
				request.change.slotId,
				request.mentorId,
				request.id,
			);
			for (const other of state.requests) {
				if (
					other.id === request.id ||
					other.teamId !== request.teamId ||
					other.status !== "approved"
				)
					continue;
				const booked = state.slots.find(
					/** Memeriksa sesi tim lainnya termasuk jeda sebelum memindahkan booking. */
					function anotherTeamSlot(slot) {
						return slot.id === other.slotId;
					},
				);
				if (
					booked &&
					booked.date === next.date &&
					booked.start < next.bufferEnd &&
					next.start < booked.bufferEnd
				)
					throw new Error(
						"Tim memiliki sesi lain yang bertabrakan dengan jadwal baru.",
					);
			}
			request.slotId = next.id;
			requestEvent(
				state,
				request,
				"Perubahan jadwal disepakati",
				`${oldSlot.date} ${oldSlot.start} → ${next.date} ${next.start} WIB. ${request.change.note}`,
			);
			for (const other of state.requests) {
				if (other.id === request.id || other.status !== "pending") continue;
				const competing = state.slots.find(
					/** Mengambil slot pengajuan lain yang mungkin kehilangan jadwal akibat perpindahan. */
					function otherSlot(slot) {
						return slot.id === other.slotId;
					},
				);
				if (competing && slotsOverlap(competing, next)) {
					transitionRequest(other, "revision_requested");
					other.revisionKind = "schedule";
					other.note =
						"Slot telah terbooking setelah perubahan jadwal sesi. Pilih slot lain.";
					requestEvent(state, other, "Jadwal perlu diganti", other.note);
					notifyRequestTeam(state, other, other.note);
				}
			}
		} else
			requestEvent(
				state,
				request,
				"Perubahan jadwal ditolak",
				"Booking lama dan link meeting tetap berlaku.",
			);
		delete request.change;
	} else throw new Error("Tindakan perubahan jadwal tidak dikenal.");
	notifyRequestTeam(state, request, "Ada pembaruan usulan jadwal mentoring.");
	const mentor = state.mentors.find(
		/** Menentukan akun mentor untuk pemberitahuan status usulan. */
		function relatedMentor(item) {
			return item.id === request.mentorId;
		},
	);
	if (mentor?.userId)
		notify(
			state,
			mentor.userId,
			"Ada pembaruan usulan jadwal mentoring",
			`/mentor/pengajuan/${request.id}`,
		);
	audit(state, "Usulan jadwal diperbarui", request.id, action);
	return request.change
		? "Usulan terkirim. Booking lama tetap berlaku sampai disepakati."
		: "Keputusan usulan tersimpan. Periksa jadwal yang berlaku pada detail sesi.";
}
