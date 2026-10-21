// TODO: Ganti operasi objek browser dengan endpoint terotorisasi ketika Storage produksi tersedia.
import { fileStore } from "@/models/demo/file-store";
import { getDemoSnapshot } from "@/models/demo/repository";
import { actorTeam, newId, requireActor } from "./context";
import { requireDocumentAccess, validateUpload } from "./document-access";
import { executeDemoCommand } from "./use-demo-controller";

/** Menyimpan objek lebih dahulu lalu metadata, serta membersihkan objek jika penyimpanan metadata gagal. */
export async function uploadDemoFile(file: File, title: string) {
	validateUpload(file);
	const state = getDemoSnapshot();
	if (!state) throw new Error("Data demo belum dimuat.");
	const actor = requireActor(state);
	const team = actorTeam(state);
	if (actor.role !== "participant" || !team)
		throw new Error("Bergabunglah dengan tim terlebih dahulu.");
	const id = newId("file");
	await fileStore("write", id, file);
	try {
		const latest = getDemoSnapshot();
		if (
			!latest ||
			latest.userId !== actor.id ||
			actorTeam(latest)?.id !== team.id
		)
			throw new Error("Sesi atau tim berubah. Silakan ulangi unggahan.");
		return executeDemoCommand("document.upload", {
			id,
			filename: file.name,
			bytes: file.size,
			title: title.trim() || file.name,
		});
	} catch (error) {
		await fileStore("delete", id);
		throw error;
	}
}

/** Mengunduh file hanya setelah pemeriksaan hak akses terbaru sebelum dan sesudah pembacaan objek. */
export async function downloadDemoFile(id: string) {
	const state = getDemoSnapshot();
	if (!state) throw new Error("Data belum siap.");
	const document = requireDocumentAccess(state, id);
	const file = await fileStore("read", id);
	const latest = getDemoSnapshot();
	if (!latest) throw new Error("Sesi berubah.");
	requireDocumentAccess(latest, id);
	if (!file)
		throw new Error(
			"File tidak ditemukan pada perangkat ini. Unggah ulang berkasnya.",
		);
	const url = URL.createObjectURL(file);
	const anchor = window.document.createElement("a");
	anchor.href = url;
	anchor.download = document.filename ?? document.title;
	anchor.click();
	/** Melepas URL sementara setelah browser memulai unduhan. */
	window.setTimeout(function releaseUrl() {
		URL.revokeObjectURL(url);
	}, 1000);
}

/** Menghapus metadata terotorisasi dan membersihkan objek lokal yang tidak lagi digunakan. */
export async function deleteDemoFile(id: string) {
	const message = executeDemoCommand("document.delete", { id });
	await fileStore("delete", id);
	return message;
}
