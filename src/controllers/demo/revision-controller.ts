// TODO: Tambahkan versi snapshot persisten dan transaksi kirim ulang pada integrasi database.
import type { DemoState } from "@/models/demo/types";
import {
	assertRequestCapacity,
	availableRequestSlot,
	requestForActor,
	transitionRequest,
} from "@/models/demo/request-policy";
import { workIsReady } from "@/models/demo/selectors";
import {
	audit,
	notify,
	requestEvent,
	requireLeader,
	requiredText,
} from "./context";
import { textValue, type CommandPayload } from "./session-controller";

/** Mengirim ulang revisi milik ketua dengan snapshot karya terbaru dan slot yang divalidasi ulang. */
export function revisionCommand(
	state: DemoState,
	action: string,
	payload: CommandPayload,
) {
	if (action !== "revision.resubmit")
		throw new Error("Tindakan revisi tidak dikenal.");
	const request = requestForActor(state, textValue(payload, "id"));
	requireLeader(state, request.teamId);
	if (request.status !== "revision_requested")
		throw new Error(
			"Pengajuan tidak sedang menunggu revisi atau sudah dikirim ulang.",
		);
	assertRequestCapacity(state, request.teamId, request.id);
	if (!workIsReady(state, request.teamId))
		throw new Error("Lengkapi Identitas Karya sebelum mengirim ulang revisi.");
	const note = requiredText(
		textValue(payload, "note"),
		"Ringkasan perbaikan",
		2000,
	);
	const slotId = textValue(payload, "slotId");
	availableRequestSlot(state, slotId, request.mentorId, request.id);
	if (request.revisionKind === "work" && slotId !== request.slotId)
		throw new Error(
			"Revisi ini hanya untuk karya. Pertahankan jadwal sebelumnya.",
		);
	const work = state.works.find(
		/** Mengambil karya terkini milik tim pemohon yang telah diperbaiki. */
		function revisedWork(item) {
			return item.teamId === request.teamId;
		},
	);
	if (!work) throw new Error("Karya tim tidak ditemukan.");
	request.title = work.title;
	request.description = work.description;
	request.slotId = slotId;
	request.documentIds = state.documents
		.filter(
			/** Membekukan daftar bahan versi terbaru dari tim yang sama. */
			function revisedDocument(item) {
				return item.teamId === request.teamId;
			},
		)
		.map(
			/** Mengambil identitas referensi bahan yang dikirim ulang. */
			function documentId(item) {
				return item.id;
			},
		);
	transitionRequest(request, "pending");
	requestEvent(state, request, "Revisi dikirim ulang", note);
	const mentor = state.mentors.find(
		/** Menentukan akun mentor penerima hasil perbaikan tim. */
		function assignedMentor(item) {
			return item.id === request.mentorId;
		},
	);
	if (mentor?.userId)
		notify(
			state,
			mentor.userId,
			"Tim mengirim ulang revisi mentoring",
			`/mentor/pengajuan/${request.id}`,
		);
	audit(state, "Revisi dikirim ulang", request.id, note);
	return "Revisi terkirim. Menunggu respons mentor kembali.";
}
