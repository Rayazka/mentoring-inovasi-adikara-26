// TODO: Gunakan idempotency key unik dan transaksi database untuk pengajuan produksi.
import type { DemoState, MentoringRequest } from "@/models/demo/types";
import { workIsReady } from "@/models/demo/selectors";
import {
	assertRequestCapacity,
	availableRequestSlot,
} from "@/models/demo/request-policy";
import {
	actorTeam,
	audit,
	newId,
	notify,
	requireActor,
	requireLeader,
	requestEvent,
} from "./context";
import { textValue, type CommandPayload } from "./session-controller";

/** Mengirim pengajuan pending dari karya tim tersimpan dengan validasi ulang dan perlindungan retry. */
export function requestCommand(
	state: DemoState,
	action: string,
	payload: CommandPayload,
) {
	if (action !== "request.submit")
		throw new Error("Tindakan pengajuan tidak dikenal.");
	const actor = requireActor(state);
	const team = actorTeam(state);
	if (actor.role !== "participant" || !team)
		throw new Error("Bentuk atau ikuti tim terlebih dahulu.");
	requireLeader(state, team.id);
	const submissionKey = textValue(payload, "submissionKey");
	if (!submissionKey || submissionKey.length > 100)
		throw new Error("Identitas pengiriman tidak valid. Muat ulang formulir.");
	if (
		state.requests.some(
			/** Mengembalikan hasil sukses ketika formulir yang sama dikirim ulang. */
			function repeatedSubmission(request) {
				return (
					request.teamId === team.id && request.submissionKey === submissionKey
				);
			},
		)
	)
		return "Pengajuan ini sudah terkirim. Buka daftar pengajuan untuk melihat statusnya.";
	assertRequestCapacity(state, team.id);
	if (!workIsReady(state, team.id))
		throw new Error(
			"Lengkapi judul dan deskripsi pada Identitas Karya terlebih dahulu.",
		);
	const mentorId = textValue(payload, "mentorId");
	const slotId = textValue(payload, "slotId");
	availableRequestSlot(state, slotId, mentorId);
	const work = state.works.find(
		/** Mengambil versi identitas karya yang sudah tersimpan saat pengajuan dibuat. */
		function submittedWork(item) {
			return item.teamId === team.id;
		},
	);
	if (!work) throw new Error("Identitas karya belum tersedia.");
	const request: MentoringRequest = {
		id: newId("MT"),
		submissionKey,
		teamId: team.id,
		mentorId,
		slotId,
		status: "pending",
		title: work.title,
		description: work.description,
		documentIds: state.documents
			.filter(
				/** Menyertakan hanya dokumen dari tim pengirim. */
				function teamDocument(item) {
					return item.teamId === team.id;
				},
			)
			.map(
				/** Membekukan daftar referensi bahan yang dikirim pada pengajuan ini. */
				function documentReference(item) {
					return item.id;
				},
			),
		meetingUrl: "",
		note: "",
		events: [],
		createdAt: new Date().toISOString(),
		submittedBy: actor.id,
	};
	requestEvent(
		state,
		request,
		"Pengajuan dikirim",
		"Menunggu respons mentor. Jadwal belum dikunci.",
	);
	state.requests.unshift(request);
	const mentor = state.mentors.find(
		/** Mengambil akun mentor untuk notifikasi pengajuan masuk. */
		function requestMentor(item) {
			return item.id === mentorId;
		},
	);
	if (mentor?.userId)
		notify(
			state,
			mentor.userId,
			`${team.name} mengajukan mentoring`,
			`/mentor/pengajuan/${request.id}`,
		);
	audit(state, "Pengajuan dikirim", request.id, team.name);
	return "Pengajuan terkirim. Jadwal baru terkunci setelah mentor menyetujui.";
}
