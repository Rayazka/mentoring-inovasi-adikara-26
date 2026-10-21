// TODO: Terapkan kebijakan setara pada metadata, Storage dan endpoint unduhan produksi.
import type { DemoState, TeamDocument } from "@/models/demo/types";
import { requireActor } from "./context";

/** Mengambil dokumen hanya bagi anggota aktif atau mentor yang menerima pengajuan tim tersebut. */
export function requireDocumentAccess(
	state: DemoState,
	documentId: string,
): TeamDocument {
	const actor = requireActor(state);
	const document = state.documents.find(
		/** Memilih metadata yang diminta tanpa mengizinkan path objek bebas. */
		function requestedDocument(item) {
			return item.id === documentId;
		},
	);
	if (!document) throw new Error("Dokumen tidak ditemukan atau sudah dihapus.");
	const member = state.teams.some(
		/** Menguji keanggotaan yang masih aktif saat akses diminta. */
		function activeMembership(team) {
			return team.id === document.teamId && team.memberIds.includes(actor.id);
		},
	);
	const assigned =
		actor.role === "mentor" &&
		state.requests.some(
			/** Mengizinkan mentor membaca bahan milik tim yang mengajukan mentoring kepadanya. */
			function assignedRequest(request) {
				return (
					request.mentorId === actor.mentorId &&
					request.teamId === document.teamId
				);
			},
		);
	if (!member && !assigned)
		throw new Error("Kamu tidak memiliki akses dokumen tim ini.");
	return document;
}

/** Memvalidasi format dan batas ukuran sebelum data contoh disimpan pada perangkat. */
export function validateUpload(file: File) {
	const extension = file.name.split(".").pop()?.toLowerCase();
	const allowed: Record<string, string[]> = {
		pdf: ["application/pdf"],
		docx: [
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		],
		pptx: [
			"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		],
		png: ["image/png"],
		jpg: ["image/jpeg"],
		jpeg: ["image/jpeg"],
	};
	if (!extension || !allowed[extension]?.includes(file.type))
		throw new Error(
			"Gunakan PDF, DOCX, PPTX, PNG, atau JPG dengan jenis file yang sesuai.",
		);
	if (!file.size || file.size > 10 * 1024 * 1024)
		throw new Error("Ukuran file harus lebih dari 0 dan maksimal 10 MB.");
}
