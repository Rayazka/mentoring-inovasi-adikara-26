// TODO: Terapkan kuota dan validasi berkas pada server sebelum mengaktifkan Storage produksi.
import type { DemoState } from "@/models/demo/types";
import { actorTeam, audit, newId, requireActor, requiredText } from "./context";
import { textValue, type CommandPayload } from "./session-controller";

/** Menambahkan metadata atau menghapus dokumen hanya dari tim aktif pelaku. */
export function documentCommand(
	state: DemoState,
	action: string,
	payload: CommandPayload,
) {
	const actor = requireActor(state);
	const team = actorTeam(state);
	if (actor.role !== "participant" || !team)
		throw new Error("Hanya anggota aktif tim yang dapat mengubah dokumen.");
	if (action === "document.upload") {
		const files = state.documents.filter(
			/** Menghitung file tim untuk menerapkan kuota demo. */
			function teamFile(item) {
				return item.teamId === team.id && item.kind === "file";
			},
		);
		const bytes = Number(payload.bytes);
		if (!Number.isFinite(bytes) || bytes <= 0 || bytes > 10 * 1024 * 1024)
			throw new Error("Ukuran file tidak valid.");
		const total = files.reduce(
			/** Menjumlahkan ukuran metadata file tim yang masih aktif. */
			function sumBytes(sum, item) {
				return sum + (item.bytes ?? 0);
			},
			0,
		);
		if (files.length >= 10 || total + bytes > 50 * 1024 * 1024)
			throw new Error("Kuota demo maksimal 10 file atau total 50 MB per tim.");
		const filename = requiredText(
			textValue(payload, "filename"),
			"Nama file",
			200,
		);
		if (
			files.some(
				/** Mencegah klik ulang menambahkan salinan file dengan nama dan ukuran sama. */
				function duplicate(item) {
					return item.filename === filename && item.bytes === bytes;
				},
			)
		)
			throw new Error("File dengan nama dan ukuran yang sama sudah tersimpan.");
		const id = textValue(payload, "id") || newId("file");
		state.documents.push({
			id,
			teamId: team.id,
			title: requiredText(textValue(payload, "title"), "Judul dokumen", 150),
			kind: "file",
			filename,
			bytes,
			uploaderId: actor.id,
			updatedAt: new Date().toISOString(),
			inaccessible: false,
		});
		audit(state, "File ditambahkan", id, filename);
		return "File tersimpan di browser ini, bukan di server.";
	}
	if (action === "document.delete") {
		const id = textValue(payload, "id");
		const document = state.documents.find(
			/** Memilih dokumen milik tim aktif saja. */
			function ownedDocument(item) {
				return item.id === id && item.teamId === team.id;
			},
		);
		if (!document)
			throw new Error("Dokumen tidak ditemukan atau bukan milik timmu.");
		state.documents = state.documents.filter(
			/** Menghapus metadata tanpa mengubah snapshot riwayat pengajuan. */
			function remainingDocument(item) {
				return item.id !== id;
			},
		);
		audit(state, "Dokumen dihapus", id, document.title);
		return "Dokumen dihapus. Referensi lama pada pengajuan tetap tercatat sebagai dokumen terhapus.";
	}
	throw new Error("Tindakan dokumen tidak dikenali.");
}
